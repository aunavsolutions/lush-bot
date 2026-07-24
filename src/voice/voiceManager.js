import { 
  joinVoiceChannel, 
  getVoiceConnection,
  EndBehaviorType,
  createAudioPlayer,
  createAudioResource,
  AudioPlayerStatus,
  StreamType
} from '@discordjs/voice';
import { pipeline } from 'stream/promises';
import { createWriteStream } from 'fs';
import { Transform } from 'stream';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from 'ffmpeg-static';
import fs from 'fs';
import path from 'path';

ffmpeg.setFfmpegPath(ffmpegPath);

import { db_config } from '../memory/database.js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { buildSquadContext } from '../memory/brain.js';

const TEMP_DIR = path.join(process.cwd(), 'temp_audio');
if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR);

// ── ROTACIÓN DE API KEYS (igual que brain.js) ──────────────────────────────
const getApiKeys = () => {
  return (process.env.GEMINI_API_KEY || '').split(',').map(k => k.trim()).filter(Boolean);
};

let currentKeyIndex = 0;

async function ejecutarConRotacionVoz(action) {
  const keys = getApiKeys();
  if (keys.length === 0) {
    throw new Error('No se configuraron API Keys de Gemini.');
  }

  for (let i = 0; i < keys.length; i++) {
    const idx = (currentKeyIndex + i) % keys.length;
    const key = keys[idx];
    try {
      const genAI = new GoogleGenerativeAI(key);
      const result = await action(genAI);
      currentKeyIndex = (idx + 1) % keys.length; // Rotar para la siguiente vez
      return result;
    } catch (error) {
      console.error(`[Voice] Error con API Key #${idx + 1}:`, error.message);
      if (i === keys.length - 1) {
        throw error;
      }
      console.log(`[Voice] Rotando a la siguiente API Key...`);
    }
  }
}

// ── COOLDOWN POR USUARIO ────────────────────────────────────────────────────
const userCooldowns = new Map();
const COOLDOWN_MS = 5000; // 5 segundos entre grabaciones del mismo usuario

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
    // No escucharnos a nosotros mismos
    if (userId === interaction.client.user.id) return;
    // Cooldown para no spamear
    if (isOnCooldown(userId)) return;
    
    console.log(`[Voice] 🎤 Usuario ${userId} empezó a hablar.`);
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
  console.log(`[Voice] 🔴 Iniciando grabación para ${userId}...`);

  try {
    const opusStream = receiver.subscribe(userId, {
      end: {
        behavior: EndBehaviorType.AfterSilence,
        duration: 2000, // 2s de silencio para cortar
      },
    });

    const pcmPath = path.join(TEMP_DIR, `${userId}_${Date.now()}.pcm`);
    const mp3Path = pcmPath.replace('.pcm', '.mp3');

    // Decodificar Opus a PCM con manejo de paquetes inválidos
    const prism = (await import('prism-media')).default || (await import('prism-media'));
    const opusDecoder = new prism.opus.Decoder({ rate: 48000, channels: 2, frameSize: 960 });
    
    // Interceptar errores del decodificador sin crashear el pipeline
    opusDecoder.on('error', (err) => {
      console.log(`[Voice] ⚠️ Paquete Opus inválido (ignorado): ${err.message}`);
    });

    const writeStream = createWriteStream(pcmPath);

    // Usar pipeline manual para manejar errores de Opus sin matar el stream
    try {
      await new Promise((resolve, reject) => {
        opusStream.pipe(opusDecoder).pipe(writeStream);
        writeStream.on('finish', resolve);
        writeStream.on('error', reject);
        opusStream.on('error', (err) => {
          console.log(`[Voice] ⚠️ Error en opus stream: ${err.message}`);
          resolve(); // No rechazar, dejar que procese lo que pudo grabar
        });
      });
    } catch (pipeErr) {
      console.log(`[Voice] ⚠️ Error en pipeline (continuando): ${pipeErr.message}`);
    }

    // Verificar que el archivo existe y tiene tamaño suficiente
    if (!fs.existsSync(pcmPath)) {
      console.log(`[Voice] ⚠️ No se generó archivo PCM, ignorando...`);
      activeRecordings.delete(userId);
      return;
    }

    const stats = fs.statSync(pcmPath);
    console.log(`[Voice] 📁 Tamaño del PCM grabado: ${stats.size} bytes`);
    
    if (stats.size < 10000) {
      console.log(`[Voice] ⚠️ Archivo muy pequeño (${stats.size} bytes), ignorando...`);
      fs.unlinkSync(pcmPath);
      activeRecordings.delete(userId);
      return;
    }

    // Convertir PCM a MP3
    console.log(`[Voice] ⚙️ Convirtiendo a MP3...`);
    await convertPcmToMp3(pcmPath, mp3Path);
    
    // Enviar a Gemini con rotación de keys
    console.log(`[Voice] 🧠 Enviando a Gemini...`);
    const base64Audio = fs.readFileSync(mp3Path).toString('base64');
    
    // Limpiar archivos temporales
    try { fs.unlinkSync(pcmPath); } catch(e) {}
    try { fs.unlinkSync(mp3Path); } catch(e) {}

    const respuestaGemini = await procesarAudioConGemini(base64Audio, userId, guild);
    console.log(`[Voice] 💬 Gemini respondió: ${respuestaGemini}`);
    
    if (respuestaGemini && respuestaGemini !== 'IGNORAR') {
      console.log(`[Voice] 🗣️ Reproduciendo con ElevenLabs...`);
      await playElevenLabsAudio(respuestaGemini, audioPlayer);
      console.log(`[Voice] ✅ Respuesta enviada al canal de voz.`);
    }
  } catch (error) {
    console.error('[Voice] ❌ Error procesando audio:', error.message);
  } finally {
    activeRecordings.delete(userId);
  }
}

function convertPcmToMp3(inputPath, outputPath) {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .inputOptions([
        '-f s16le',
        '-ar 48000',
        '-ac 2'
      ])
      .outputOptions('-b:a 64k')
      .save(outputPath)
      .on('end', resolve)
      .on('error', reject);
  });
}

// ── GEMINI CON ROTACIÓN ─────────────────────────────────────────────────────

async function procesarAudioConGemini(base64Audio, userId, guild) {
  const squadContext = buildSquadContext();
  const nombreUsuario = guild.members.cache.get(userId)?.displayName || 'Alguien';

  const promptTexto = `
Eres Lush Bot, en tu modo Casanova. Estás escuchando un canal de voz de Discord.
Acabas de escuchar un audio del usuario "${nombreUsuario}".

REGLAS:
1. Transcribe internamente lo que dijo el usuario.
2. Si el usuario dice la palabra "Bot" (o algo que suene muy parecido como "bот", "boh", "bought") en cualquier parte de su frase, entonces TE ESTÁ HABLANDO A TI. Respóndele.
3. Si el usuario NO dice "Bot" en ningún momento, o si el audio es solo ruido/silencio, responde EXACTAMENTE con: IGNORAR
4. Si decides responder, hazlo de forma coqueta si es mujer, o de forma amistosa y cool si es hombre. 
5. Tu respuesta debe ser SOLO el texto hablado (1 a 3 frases cortas). Sin asteriscos ni emojis.
Contexto: ${squadContext.slice(0, 500)}
`;

  try {
    return await ejecutarConRotacionVoz(async (genAI) => {
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
      
      const result = await model.generateContent([
        promptTexto,
        {
          inlineData: {
            mimeType: "audio/mp3",
            data: base64Audio
          }
        }
      ]);
      return result.response.text().trim();
    });
  } catch (e) {
    console.error('[Voice] Error en Gemini (todas las keys fallaron):', e.message);
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
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.5
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
