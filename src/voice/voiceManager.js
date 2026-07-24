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
import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from 'ffmpeg-static';
import fs from 'fs';
import path from 'path';

ffmpeg.setFfmpegPath(ffmpegPath);

import { db_config } from '../memory/database.js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { buildSquadContext } from '../memory/brain.js';

// Usamos el mismo Gemini configurado en la app
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const TEMP_DIR = path.join(process.cwd(), 'temp_audio');
if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR);

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

  await interaction.reply(`🎙️ Me he unido a **${voiceChannel.name}**. Háblame mencionando "Lush", "Bot" o "Lush bot".`);

  const receiver = connection.receiver;
  const audioPlayer = createAudioPlayer();
  connection.subscribe(audioPlayer);

  // Escuchar a cualquier usuario que empiece a hablar
  receiver.speaking.on('start', (userId) => {
    // Para evitar solapamientos pesados, podríamos filtrar
    // pero por ahora grabamos la frase
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

// Mapa para evitar grabar al mismo usuario múltiples veces simultáneamente
const activeRecordings = new Set();

async function recordAndProcess(receiver, userId, audioPlayer, guild) {
  if (activeRecordings.has(userId)) return;
  
  // No escucharnos a nosotros mismos
  if (userId === guild.client.user.id) return;
  
  activeRecordings.add(userId);

  try {
    // 1. Grabar PCM
    const pcmStream = receiver.subscribe(userId, {
      end: {
        behavior: EndBehaviorType.AfterSilence,
        duration: 1500, // Espera 1.5s de silencio para cortar
      },
    });

    const pcmPath = path.join(TEMP_DIR, `${userId}_${Date.now()}.pcm`);
    const mp3Path = path.join(TEMP_DIR, `${userId}_${Date.now()}.mp3`);
    
    const writeStream = createWriteStream(pcmPath);
    await pipeline(pcmStream, writeStream);

    // Si el archivo está muy pequeño (ruido), ignorar
    const stats = fs.statSync(pcmPath);
    if (stats.size < 40000) {
      // ruido muy corto
      fs.unlinkSync(pcmPath);
      activeRecordings.delete(userId);
      return;
    }

    // 2. Convertir PCM a MP3
    await convertPcmToMp3(pcmPath, mp3Path);
    
    // 3. Enviar a Gemini para Transcripción/Respuesta
    const base64Audio = fs.readFileSync(mp3Path).toString('base64');
    fs.unlinkSync(pcmPath);
    fs.unlinkSync(mp3Path);

    const respuestaGemini = await procesarAudioConGemini(base64Audio, userId, guild);
    if (respuestaGemini && respuestaGemini !== 'IGNORAR') {
      // 4. Convertir texto a voz con ElevenLabs
      await playElevenLabsAudio(respuestaGemini, audioPlayer);
    }
  } catch (error) {
    console.error('[Voice] Error procesando audio:', error.message);
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
        '-ac 2' // Discord native PCM is 48kHz 2-channel little-endian
      ])
      .outputOptions('-b:a 64k')
      .save(outputPath)
      .on('end', resolve)
      .on('error', reject);
  });
}

async function procesarAudioConGemini(base64Audio, userId, guild) {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
  
  const squadContext = buildSquadContext();
  const nombreUsuario = guild.members.cache.get(userId)?.displayName || 'Alguien';

  const promptTexto = `
Eres Lush Bot, en tu modo Casanova. Estás escuchando un canal de voz de Discord.
Acabas de escuchar un audio del usuario "${nombreUsuario}".

REGLAS:
1. Transcribe internamente lo que dijo.
2. Si el usuario NO dijo la palabra "Lush", "Bot" o "Lush bot" para llamarte, o si solo es ruido de fondo, responde EXACTAMENTE y ÚNICAMENTE con la palabra: IGNORAR.
3. Si SÍ te llamó, respóndele de forma coqueta si es mujer (como Reverie o Geri), o de forma amistosa y cool si es hombre. 
4. Tu respuesta debe ser SOLO el texto de lo que vas a decir en voz alta. No pongas asteriscos ni acciones visuales, solo texto hablado. Se natural y corto (1 a 3 frases).
Contexto: ${squadContext.slice(0, 500)}
`;

  try {
    const result = await model.generateContent([
      promptTexto,
      {
        inlineData: {
          mimeType: "audio/mp3",
          data: base64Audio
        }
      }
    ]);
    const responseText = result.response.text().trim();
    return responseText;
  } catch (e) {
    console.error('[Voice] Error en Gemini:', e.message);
    return 'IGNORAR';
  }
}

async function playElevenLabsAudio(texto, audioPlayer) {
  const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
  const VOICE_ID = process.env.ELEVENLABS_VOICE_ID || '21m00Tcm4TlvDq8ikWAM'; // Rachel default
  
  if (!ELEVENLABS_API_KEY) {
    console.log('No hay ELEVENLABS_API_KEY configurada.');
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

    // Convert fetch stream to Node stream for discord.js
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
