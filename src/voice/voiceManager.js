import { 
  joinVoiceChannel, 
  getVoiceConnection,
  EndBehaviorType,
  createAudioPlayer,
  createAudioResource,
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
if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR, { recursive: true });

// ── ROTACIÓN DE API KEYS ────────────────────────────────────────────────────
const getApiKeys = () =>
  (process.env.GEMINI_API_KEY || '').split(',').map(k => k.trim()).filter(Boolean);

let currentKeyIndex = 0;

async function ejecutarConRotacionVoz(action) {
  const keys = getApiKeys();
  if (keys.length === 0) throw new Error('No hay API Keys de Gemini configuradas.');

  for (let i = 0; i < keys.length; i++) {
    const idx = (currentKeyIndex + i) % keys.length;
    try {
      const genAI = new GoogleGenerativeAI(keys[idx]);
      const result = await action(genAI);
      currentKeyIndex = (idx + 1) % keys.length;
      return result;
    } catch (error) {
      if (i === keys.length - 1) throw error;
      console.log(`[Voice] Rotando key... (${error.message.slice(0, 60)})`);
    }
  }
}

// ── ANTI-BUCLE: flag para no escucharse a sí mismo ─────────────────────────
let isBotSpeaking = false;

// ── COOLDOWN POR USUARIO ────────────────────────────────────────────────────
const userCooldowns = new Map();
const COOLDOWN_MS = 5000;

function isOnCooldown(userId) {
  const last = userCooldowns.get(userId);
  return last && (Date.now() - last) < COOLDOWN_MS;
}
function setCooldown(userId) { userCooldowns.set(userId, Date.now()); }

// ── ENTRAR AL CANAL ─────────────────────────────────────────────────────────

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

  const ownerId = interaction.user.id; // Solo responder a quien invocó el comando
  await interaction.reply(`🎙️ Entré a **${voiceChannel.name}**. Solo te escucho a ti, <@${ownerId}>. Di "Bot" para hablar conmigo.`);

  const receiver = connection.receiver;
  const audioPlayer = createAudioPlayer();
  connection.subscribe(audioPlayer);

  // Saludo inicial (también abre el puerto UDP de Discord)
  await playElevenLabsAudio('Ya llegué.', audioPlayer);

  receiver.speaking.on('start', (userId) => {
    if (userId === interaction.client.user.id) return; // ignorar al bot
    if (userId !== ownerId) return; // 🔒 solo escuchar a quien invocó /voz
    if (isBotSpeaking) return;      // no escucharse a sí mismo
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

// ── GRABACIÓN ───────────────────────────────────────────────────────────────
const activeRecordings = new Set();

async function recordAndProcess(receiver, userId, audioPlayer, guild) {
  if (activeRecordings.has(userId)) return;
  activeRecordings.add(userId);
  setCooldown(userId);

  try {
    const opusStream = receiver.subscribe(userId, {
      end: { behavior: EndBehaviorType.AfterSilence, duration: 1000 }
    });

    const ts = Date.now();
    const pcmPath = path.join(TEMP_DIR, `${userId}_${ts}.pcm`);
    const wavPath = path.join(TEMP_DIR, `${userId}_${ts}.wav`);

    const prism = (await import('prism-media')).default || (await import('prism-media'));
    const opusDecoder = new prism.opus.Decoder({ rate: 48000, channels: 2, frameSize: 960 });
    opusDecoder.on('error', () => {});

    const writeStream = createWriteStream(pcmPath);
    await new Promise((resolve) => {
      opusStream.pipe(opusDecoder).pipe(writeStream);
      writeStream.on('finish', resolve);
      writeStream.on('error', resolve);
      opusStream.on('error', resolve);
    });

    if (!fs.existsSync(pcmPath) || fs.statSync(pcmPath).size < 10000) {
      cleanup(pcmPath, wavPath);
      return;
    }

    // PCM → WAV mono 16kHz (más pequeño = más rápido de subir a STT)
    await convertPcmToWav(pcmPath, wavPath);
    cleanup(pcmPath);

    // ── PASO 1: STT con ElevenLabs ─────────────────────────────────────────
    const transcripcion = await transcribirConElevenLabs(wavPath);
    cleanup(wavPath);

    if (!transcripcion) return;

    console.log(`[Voice] 🎙️ Transcripción: "${transcripcion}"`);

    // ── PASO 2: Detección de keyword LOCAL (sin gastar Gemini) ─────────────
    const lower = transcripcion.toLowerCase();
    const fueConvocado = lower.includes('bot') || lower.includes('lush');

    if (!fueConvocado) {
      console.log(`[Voice] 🤫 Ignorando: no me llamaron.`);
      return;
    }

    console.log(`[Voice] 🎯 Me llamaron, generando respuesta...`);

    // ── PASO 3: Respuesta con Gemini SOLO TEXTO (mucho más barato) ─────────
    const nombreUsuario = guild.members.cache.get(userId)?.displayName || 'Alguien';
    const respuesta = await generarRespuestaTexto(transcripcion, nombreUsuario);

    if (!respuesta || respuesta === 'IGNORAR') return;

    console.log(`[Voice] 💬 Respuesta: "${respuesta}"`);

    // ── PASO 4: TTS con ElevenLabs ─────────────────────────────────────────
    await playElevenLabsAudio(respuesta, audioPlayer);

  } catch (err) {
    console.error('[Voice] ❌ Error:', err.message);
  } finally {
    activeRecordings.delete(userId);
  }
}

// ── UTILIDADES ──────────────────────────────────────────────────────────────

function cleanup(...paths) {
  for (const p of paths) {
    try { if (fs.existsSync(p)) fs.unlinkSync(p); } catch(e) {}
  }
}

function convertPcmToWav(inputPath, outputPath) {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .inputOptions(['-f s16le', '-ar 48000', '-ac 2'])
      .outputOptions(['-ar 16000', '-ac 1'])
      .save(outputPath)
      .on('end', resolve)
      .on('error', reject);
  });
}

// ── STT: ELEVENLABS (ya tienes la key, no gasta quota de Gemini) ────────────

async function transcribirConElevenLabs(wavPath) {
  const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
  if (!ELEVENLABS_API_KEY) return null;

  try {
    const audioBuffer = fs.readFileSync(wavPath);
    const { FormData, Blob } = await import('node:buffer').then(() => ({ 
      FormData: globalThis.FormData, 
      Blob: globalThis.Blob 
    }));

    const formData = new globalThis.FormData();
    formData.append('file', new globalThis.Blob([audioBuffer], { type: 'audio/wav' }), 'audio.wav');
    formData.append('model_id', 'scribe_v1');
    formData.append('language_code', 'es');

    const response = await fetch('https://api.elevenlabs.io/v1/speech-to-text', {
      method: 'POST',
      headers: { 'xi-api-key': ELEVENLABS_API_KEY },
      body: formData
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('[Voice] ElevenLabs STT error:', err.slice(0, 100));
      return null;
    }

    const data = await response.json();
    return data.text || null;
  } catch (e) {
    console.error('[Voice] Error en ElevenLabs STT:', e.message);
    return null;
  }
}

// ── RESPUESTA GEMINI (solo texto, mucho más eficiente) ──────────────────────

async function generarRespuestaTexto(transcripcion, nombreUsuario) {
  const squadContext = buildSquadContext();

  const prompt = `Eres Lush Bot, modo Casanova. El usuario "${nombreUsuario}" dijo: "${transcripcion}".
Respóndele en 1-2 frases habladas. Si es mujer sé coqueto y seductor; si es hombre sé amistoso y cool.
Solo el texto hablado, sin asteriscos ni emojis.
Contexto del servidor: ${squadContext.slice(0, 300)}`;

  try {
    return await ejecutarConRotacionVoz(async (genAI) => {
      const model = genAI.getGenerativeModel({ 
        model: 'gemini-2.5-flash',
        generationConfig: { maxOutputTokens: 80 }
      });
      const result = await model.generateContent(prompt);
      return result.response.text().trim();
    });
  } catch (e) {
    console.error('[Voice] Error Gemini texto:', e.message);
    return null;
  }
}

// ── TTS: ELEVENLABS ─────────────────────────────────────────────────────────

async function playElevenLabsAudio(texto, audioPlayer) {
  const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
  const VOICE_ID = process.env.ELEVENLABS_VOICE_ID || '21m00Tcm4TlvDq8ikWAM';
  
  if (!ELEVENLABS_API_KEY) return;

  isBotSpeaking = true;

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
        model_id: 'eleven_turbo_v2_5',
        voice_settings: { stability: 0.5, similarity_boost: 0.75 }
      })
    });

    if (!response.ok) throw new Error(`ElevenLabs TTS: ${response.statusText}`);

    const { Readable } = await import('stream');
    const nodeStream = Readable.fromWeb(response.body);
    const resource = createAudioResource(nodeStream, { inputType: StreamType.Arbitrary });

    audioPlayer.play(resource);

    // Esperar a que termine antes de volver a escuchar
    await new Promise(resolve => {
      audioPlayer.once('stateChange', (_old, newState) => {
        if (newState.status === 'idle') resolve();
      });
      setTimeout(resolve, 15000); // timeout de seguridad
    });

  } catch (e) {
    console.error('[Voice] Error TTS:', e.message);
  } finally {
    isBotSpeaking = false;
  }
}
