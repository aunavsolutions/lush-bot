// src/events/messageCreate.js
// El oído del bot — escucha todo, actúa cuando tiene sentido

import { db_frases, db_lore, db_triggers, db_historial, db_config } from '../memory/database.js';
import { responderMensaje, debeResponder } from '../memory/brain.js';
import { agregarXP, embedNivelUp } from '../levels.js';
import { checkRoleplay } from '../roleplay.js';

// Canales que alimentan la memoria del bot
const CANALES_MEMORIA = {
  'lore-del-squad': 'lore',
  'memes-del-squad': 'meme',
  'frases-del-squad': 'frase',
  'audios-del-squad': 'audio',
  'highlights': 'lore',
};

// Cache de historial de conversación por canal (para contexto)
const chatHistory = new Map();

function getChatHistory(channelId) {
  if (!chatHistory.has(channelId)) {
    chatHistory.set(channelId, []);
  }
  return chatHistory.get(channelId);
}

function addToChatHistory(channelId, role, content) {
  const history = getChatHistory(channelId);
  history.push({ role, content });
  // Mantener solo los últimos 10 mensajes
  if (history.length > 10) history.shift();
}

export default async function onMessageCreate(message) {
  // Ignorar bots (incluyendo a sí mismo)
  if (message.author.bot) return;

  const channelName = message.channel.name?.toLowerCase() || '';
  const content = message.content?.trim();
  const guildConfig = message.guild
    ? db_config.obtener(message.guild.id)
    : {};

  if (!content) return;

  // ── 1. GUARDAR EN MEMORIA según el canal ──────────────────────────────────
  const tipoCanal = CANALES_MEMORIA[channelName];

  if (tipoCanal === 'lore') {
    db_lore.guardar(content, message.author.username);
    console.log(`[Memoria] Lore guardado: "${content.slice(0, 50)}..."`);
    return; // No responder en canales de archivo
  }

  if (tipoCanal === 'frase') {
    db_frases.guardar(content, message.author.username, channelName);
    console.log(`[Memoria] Frase guardada: "${content.slice(0, 50)}"`);
    return;
  }

  if (tipoCanal === 'meme' || tipoCanal === 'audio') {
    // Solo guardar si tiene texto descriptivo
    if (content.length > 5) {
      db_frases.guardar(content, message.author.username, channelName);
    }
    return;
  }

  // ── 1.5. XP PASIVA + ROLEPLAY ────────────────────────────────────────────
  // Dar XP por chatear (solo mensajes con sustancia)
  if (content.length >= 5) {
    const xpGanada = Math.floor(Math.random() * 10) + 5; // 5-15 XP por mensaje
    const resultado = agregarXP(message.author.id, xpGanada);

    if (resultado.subioDeNivel) {
      const embed = embedNivelUp(message.author.username, resultado);
      try {
        await message.channel.send({ embeds: [embed] });
      } catch (e) {
        console.error('[Nivel] Error al enviar nivel up:', e.message);
      }
    }
  }

  // También dar monedas pasivas (30% chance, 1-3 monedas)
  if (content.length >= 5 && Math.random() < 0.3) {
    const { db_economia } = await import('../memory/database.js');
    const monedas = Math.floor(Math.random() * 3) + 1;
    db_economia.agregarMonedas(message.author.id, monedas);
  }
  
  if (await checkRoleplay(message)) {
    // Si era un comando de rol (*abrazo*), ya envió el gif, detenemos aquí.
    return;
  }

  // ── 2. DETECTAR TRIGGERS ──────────────────────────────────────────────────
  const triggersDetectados = db_triggers.detectar(content);

  if (triggersDetectados.length > 0) {
    // Cooldown anti-spam
    if (db_historial.respondioReciente(message.channel.id, 15)) return;

    const trigger = triggersDetectados[0];

    if (trigger.tipo === 'frase' && trigger.respuesta) {
      await message.channel.sendTyping();
      setTimeout(async () => {
        await message.channel.send(trigger.respuesta);
        db_historial.registrar('trigger', trigger.id, message.channel.id);
      }, 800 + Math.random() * 1200); // Delay natural
      return;
    }

    // Trigger que activa Gemini
    if (trigger.tipo === 'claude') {
      await handleAIResponse(message, content, guildConfig);
      return;
    }
  }

  // ── 3. MENCIÓN DIRECTA O POR NOMBRE ──────────────────────────────────────
  const nombreBotRegex = new RegExp(`\\b${message.client.user.username}\\b`, 'i');
  const botMencionado = message.mentions.users.has(message.client.user.id) || nombreBotRegex.test(content);

  if (botMencionado) {
    const mensajeSinMencion = content.replace(/<@!?\d+>/g, '').replace(nombreBotRegex, '').trim();
    await handleAIResponse(message, mensajeSinMencion || '¿qué?', guildConfig);
    return;
  }

  // ── 4. GUARDAR FRASES INTERESANTES (aprendizaje pasivo) ───────────────────
  // Guardar frases que suenen a humor/jerga del squad (más de 10 chars, con expresiones)
  const esInteresante = content.length > 15 &&
    (content.includes('jaja') ||
     content.includes('lmao') ||
     content.includes('xd') ||
     content.includes('jeje') ||
     content.includes('💀') ||
     content.includes('😭') ||
     /[A-Z]{3,}/.test(content)); // GRITOS en caps

  if (esInteresante && Math.random() < 0.15) { // 15% de chance de guardar
    db_frases.guardar(content, message.author.username, channelName);
  }

  // ── 5. RESPUESTA ORGÁNICA OCASIONAL ──────────────────────────────────────
  // Solo si no hubo respuesta reciente y con probabilidad baja
  const cooldown = parseInt(process.env.RESPONSE_COOLDOWN || '15');
  if (db_historial.respondioReciente(message.channel.id, cooldown)) return;

  const chanceRespuesta = 0.15; // 15% de los mensajes
  if (Math.random() > chanceRespuesta) {
    // Aún así, guardar en historial de chat para contexto futuro
    addToChatHistory(message.channel.id, 'user', `${message.author.username}: ${content}`);
    return;
  }

  // Preguntar a Gemini si vale la pena responder
  const vale = await debeResponder(content, guildConfig);
  if (!vale) return;

  await handleAIResponse(message, content, guildConfig);
}

// ── Handler centralizado de respuesta IA ──────────────────────────────────

async function handleAIResponse(message, content, guildConfig) {
  try {
    await message.channel.sendTyping();

    const history = getChatHistory(message.channel.id);
    const mensajeConAutor = `${message.author.username}: ${content}`;

    // Delay humano (entre 1 y 3 segundos)
    await new Promise(r => setTimeout(r, 1000 + Math.random() * 2000));

    const respuesta = await responderMensaje(mensajeConAutor, history, guildConfig, message.author.id, message.author.username);

    if (respuesta && respuesta.length > 0) {
      await message.channel.send(respuesta);

      // Actualizar historial
      addToChatHistory(message.channel.id, 'user', mensajeConAutor);
      addToChatHistory(message.channel.id, 'assistant', respuesta);

      db_historial.registrar('gemini', null, message.channel.id);
    }
  } catch (error) {
    console.error('[MessageCreate] Error:', error.message);
  }
}
