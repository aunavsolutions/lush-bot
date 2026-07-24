import { 
  joinVoiceChannel, 
  getVoiceConnection,
  EndBehaviorType,
  createAudioPlayer,
  createAudioResource,
  AudioPlayerStatus,
  StreamType
} from '@discordjs/voice';
import { createWriteStream } from 'fs';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from 'ffmpeg-static';
import fs from 'fs';
import path from 'path';

ffmpeg.setFfmpegPath(ffmpegPath);

import { GoogleGenerativeAI } from '@google/generative-ai';
import { buildSquadContext } from '../memory/brain.js';

const TEMP_DIR = path.join(process.cwd(), 'temp_audio');
if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR);

// ── ROTACIÓN DE API KEYS ────────────────────────────────────────────────────
const getApiKeys = () => {
  return (process.env.GEMINI_API_KEY || '').split(',').map(k => k.trim()).filter(Boolean);
};

let currentKeyIndex = 0;

async function ejecutarConRotacionVoz(action) {
  const keys = getApiKeys();
  if (keys.length === 0) throw new Error('No se configuraron API Keys de Gemini.');

  for (let i = 0; i < keys.length; i++) {
    const idx = (currentKeyIndex + i) % keys.length;
    const key = keys[idx];
    try {
      const genAI = new GoogleGenerativeAI(key);
      const result = await action(genAI);
      currentKeyIndex = (idx + 1) % keys.length;
      return result;
    } catch (error) {
      console.error(`[Voice] Error con API Key #${idx + 1}:`, error.message);
      if (i === keys.length - 1) throw error;
      console.log(`[Voice] Rotando a la siguiente API Key...`);
    }
  }
}

// ── COOLDOWN POR USUARIO ────────────────────────────────────────────────────
const userCooldowns = new Map();
const COOLDOWN_MS = 4000; // 4 segundos entre grabaciones

function isOnCooldown(userId) {
  const lastTime = userCooldowns.get(userId);
  if (!lastTime) return false;
  return (Date.now() - lastTime) < COOLDOWN_MS;
}

function setCooldown(userId) {
  userCooldowns.set(userId, Date.now());
}

// ── ENTRAR AL CANAL DE VOZ ──────────────────────────────────────────────────

export async function handleVozEntrar(interaction) {
  const voiceChannel = interaction.member.voice.channel;
  if (!voiceChannel) {
    return interaction.reply({ content: '¡Debes estar en un canal de voz primero!', ephemeral: true });
  }

  const connection = joinVoiceChannel({
    channelId: voiceChannel.id,
    guildId: interaction.guild.id,
    adapterCreator: interaction.guild.voiceAdapterCreator,
    selfDeaf: false,
    selfMute: false
  });

  await interaction.reply(`🎙️ Me he unido a **${voiceChannel.name}**. Háblame diciendo "Bot" para que te escuche.`);

  const receiver = connection.receiver;
  const audioPlayer = createAudioPlayer();
  connection.subscribe(audioPlayer);

  // Saludar al entrar (también abre el puerto UDP de Discord)
  playElevenLabsAudio("Ya llegué.", audioPlayer).catch(console.error);

  // Escuchar a cualquier usuario que empiece a hablar
  receiver.speaking.on('start', (userId) => {
    if (userId === interaction.client.user.id) return;
    if (isOnCooldown(userId)) return;
    
    recordAndProcess(receiver, userId, audioPlayer, interaction.guild);
  });
}

export async function handleVozSalir(interaction) {
  const connection = getVoiceConnection(interaction.guild.id);
  if (connection) {
    connection.destroy();
    return interaction.reply('Me salí del canal de voz. ¡Chao!');
  }
  return interaction.reply({ content: 'No estoy en ningún canal de voz.', ephemeral: true });
}

// ── GRABACIÓN Y PROCESAMIENTO ───────────────────────────────────────────────
const activeRecordings = new Set();

async function recordAndProcess(receiver, userId, audioPlayer, guild) {
  if (activeRecordings.has(userId)) return;
  
  activeRecordings.add(userId);
  setCooldown(userId);
  const startTime = Date.now();

  try {
    const opusStream = receiver.subscribe(userId, {
      end: {
        behavior: EndBehaviorType.AfterSilence,
        duration: 1000, // ⚡ 1 segundo de silencio (antes 2s)
      },
    });

    const timestamp = Date.now();
    const pcmPath = path.join(TEMP_DIR, `${userId}_${timestamp}.pcm`);
    const wavPath = path.join(TEMP_DIR, `${userId}_${timestamp}.wav`);

    // Decodificar Opus a PCM
    const prism = (await import('prism-media')).default || (await import('prism-media'));
    const opusDecoder = new prism.opus.Decoder({ rate: 48000, channels: 2, frameSize: 960 });
    
    // Ignorar paquetes Opus inválidos sin crashear
    opusDecoder.on('error', () => {});

    const writeStream = createWriteStream(pcmPath);

    await new Promise((resolve, reject) => {
      opusStream.pipe(opusDecoder).pipe(writeStream);
      writeStream.on('finish', resolve);
      writeStream.on('error', reject);
      opusStream.on('error', () => resolve());
    });

    // Verificar tamaño
    if (!fs.existsSync(pcmPath)) { activeRecordings.delete(userId); return; }
    const stats = fs.statSync(pcmPath);
    
    if (stats.size < 10000) {
      try { fs.unlinkSync(pcmPath); } catch(e) {}
      activeRecordings.delete(userId);
      return;
    }

    // ⚡ Convertir PCM → WAV (mucho más rápido que MP3, Gemini lo acepta igual)
    await convertPcmToWav(pcmPath, wavPath);
    
    const base64Audio = fs.readFileSync(wavPath).toString('base64');
    try { fs.unlinkSync(pcmPath); } catch(e) {}
    try { fs.unlinkSync(wavPath); } catch(e) {}

    // ⚡ Enviar a Gemini (modelo rápido)
    const respuestaGemini = await procesarAudioConGemini(base64Audio, userId, guild);
    
    if (respuestaGemini && respuestaGemini !== 'IGNORAR') {
      // ⚡ Generar voz y reproducir
      const totalMs = Date.now() - startTime;
      console.log(`[Voice] ✅ Respuesta en ${totalMs}ms: "${respuestaGemini}"`);
      await playElevenLabsAudio(respuestaGemini, audioPlayer);
    }
  } catch (error) {
    console.error('[Voice] ❌ Error:', error.message);
  } finally {
    activeRecordings.delete(userId);
  }
}

// ⚡ WAV es más rápido de generar que MP3 (sin compresión compleja)
function convertPcmToWav(inputPath, outputPath) {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .inputOptions(['-f s16le', '-ar 48000', '-ac 2'])
      .outputOptions(['-c:a pcm_s16le', '-ar 16000', '-ac 1']) // Mono 16kHz para Gemini (archivo más pequeño = envío más rápido)
      .save(outputPath)
      .on('end', resolve)
      .on('error', reject);
  });
}

// ── GEMINI (modelo rápido) ──────────────────────────────────────────────────

async function procesarAudioConGemini(base64Audio, userId, guild) {
  const squadContext = buildSquadContext();
  const nombreUsuario = guild.members.cache.get(userId)?.displayName || 'Alguien';

  // ⚡ Prompt corto = respuesta más rápida
  const promptTexto = `Eres Lush Bot (modo Casanova) en un canal de voz de Discord. Audio de "${nombreUsuario}".
Si dice "Bot": responde coqueto (mujer) o cool (hombre), 1-2 frases, solo texto hablado.
Si NO dice "Bot" o es ruido: responde solo IGNORAR.
Contexto: ${squadContext.slice(0, 300)}`;

  try {
    return await ejecutarConRotacionVoz(async (genAI) => {
      // ⚡ gemini-2.0-flash-lite: el modelo más rápido de Google, ideal para STT + respuesta corta
      const model = genAI.getGenerativeModel({ 
        model: 'gemini-2.0-flash-lite',
        generationConfig: { maxOutputTokens: 100 } // Limitar para que responda rápido
      });
      
      const result = await model.generateContent([
        promptTexto,
        { inlineData: { mimeType: "audio/wav", data: base64Audio } }
      ]);
      return result.response.text().trim();
    });
  } catch (e) {
    console.error('[Voice] Error en Gemini:', e.message);
    return 'IGNORAR';
  }
}

// ── ELEVENLABS TTS ──────────────────────────────────────────────────────────

async function playElevenLabsAudio(texto, audioPlayer) {
  const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
  const VOICE_ID = process.env.ELEVENLABS_VOICE_ID || '21m00Tcm4TlvDq8ikWAM';
  
  if (!ELEVENLABS_API_KEY) {
    console.log('[Voice] No hay ELEVENLABS_API_KEY configurada.');
    return;
  }

  try {
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}/stream`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'xi-api-key': ELEVENLABS_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text: texto,
        model_id: 'eleven_turbo_v2_5', // ⚡ Modelo turbo de ElevenLabs (3x más rápido que multilingual_v2)
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75
        }
      })
    });

    if (!response.ok) {
      throw new Error(`ElevenLabs falló: ${response.statusText}`);
    }

    const { Readable } = await import('stream');
    const nodeStream = Readable.fromWeb(response.body);

    const resource = createAudioResource(nodeStream, {
      inputType: StreamType.Arbitrary
    });

    audioPlayer.play(resource);

  } catch (e) {
    console.error('[Voice] Error en ElevenLabs:', e.message);
  }
}
