// src/events/randomEvents.js
// Los momentos donde el bot aparece de la nada — eventos temáticos Lush

import { EmbedBuilder } from 'discord.js';
import { db_frases, db_lore, db_historial } from '../memory/database.js';
import { generarEventoRandom } from '../memory/brain.js';

// Intervalos de eventos (en ms)
const INTERVALO_MIN = 2 * 60 * 1000;  // 2 minutos
const INTERVALO_MAX = 8 * 60 * 1000;  // 8 minutos
const HORA_INICIO = 10; // 10am — no molestar de madrugada
const HORA_FIN = 23;    // 11pm

function enHorarioActivo() {
  const hora = new Date().getHours();
  return hora >= HORA_INICIO && hora <= HORA_FIN;
}

function getIntervaloRandom() {
  return INTERVALO_MIN + Math.random() * (INTERVALO_MAX - INTERVALO_MIN);
}

// Obtener un canal "activo" del servidor para postear
async function getCanalActivo(guild) {
  try {
    const canales = guild.channels.cache.filter(c =>
      c.isTextBased() &&
      !c.name.includes('lore') &&
      !c.name.includes('memes') &&
      !c.name.includes('frases') &&
      !c.name.includes('audios') &&
      !c.name.includes('reglas') &&
      !c.name.includes('anuncio') &&
      !c.name.includes('logs') &&
      c.permissionsFor(guild.members.me)?.has('SendMessages')
    );

    if (canales.size === 0) return null;

    const canalesArray = [...canales.values()];
    return canalesArray[Math.floor(Math.random() * canalesArray.length)];
  } catch {
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════
// 🎯 TIPOS DE EVENTO — Temáticos de comunidad general
// ═══════════════════════════════════════════════════════════════

const EVENTOS_TEMATICOS = [
  // Pregunta del día
  () => {
    const preguntas = [
      '\u00bfQué están haciendo hoy?',
      '\u00bfCuál es la última serie/película que vieron y la recomiendan?',
      '\u00bfQué canción han tenido en loop esta semana?',
      '\u00bfCuál fue lo mejor que les pasó esta semana?',
      '\u00bfQué harían si tuvieran un día libre sin obligaciones?',
      '\u00bfCafé, té o algo más? \u00bfPor qué?',
    ];
    const pregunta = preguntas[Math.floor(Math.random() * preguntas.length)];

    return new EmbedBuilder()
      .setTitle('\u2753 Pregunta del Día')
      .setDescription(`${pregunta}\n\n*Comenten abajo \ud83d\udc47*`)
      .setColor('#FF6600');
  },

  // Debate random
  () => {
    const debates = [
      { a: 'Pizza con pi\u00f1a', b: 'Pizza sin pi\u00f1a' },
      { a: 'Quedarse despierto hasta tarde', b: 'Madrugar' },
      { a: 'Hot dog es un s\u00e1ndwich', b: 'Hot dog NO es un s\u00e1ndwich' },
      { a: 'Pel\u00edculas', b: 'Series' },
      { a: 'Verano', b: 'Invierno' },
      { a: 'Escuchar m\u00fasica con letra', b: 'Escuchar m\u00fasica sin letra' },
    ];
    const debate = debates[Math.floor(Math.random() * debates.length)];

    return new EmbedBuilder()
      .setTitle('\ud83d\udd25 Debate del Chat')
      .setDescription(
        `**${debate.a}** vs **${debate.b}**\n\n` +
        `\u00bfDe qué lado están? Defiendan su postura. \ud83e\udd4a`
      )
      .setColor('#E91E63');
  },

  // Mini encuesta
  () => {
    const encuestas = [
      { q: '\u00bfC\u00f3mo est\u00e1 el ambiente hoy?', ops: ['\ud83d\udd25 Activo', '\ud83d\ude34 Tranquilo', '\ud83e\udd37 Depende'] },
      { q: '\u00bfQu\u00e9 prefieren para el fin de semana?', ops: ['\ud83c\udf7b Salir', '\ud83c\udfe0 Quedarse en casa', '\ud83d\ude02 Ninguno'] },
      { q: '\u00bfCu\u00e1ntas horas duermen normalmente?', ops: ['\ud83d\ude34 Menos de 6', '\ud83d\ude42 6-8 horas', '\ud83e\udee0 M\u00e1s de 8'] },
    ];
    const enc = encuestas[Math.floor(Math.random() * encuestas.length)];

    return new EmbedBuilder()
      .setTitle('\ud83d\udcca Mini Encuesta')
      .setDescription(
        `**${enc.q}**\n\n` +
        enc.ops.map(o => `> ${o}`).join('\n') +
        '\n\n*Respondan en el chat \ud83d\udc47*'
      )
      .setColor('#3498DB');
  },

  // Shoutout Random
  () => {
    const halagos = [
      'siempre tiene algo interesante que decir',
      'es la vibra del chat',
      'merece m\u00e1s cr\u00e9dito del que recibe',
      'hace que la familia valga la pena',
      'tiene una energ\u00eda que contagia',
      'siempre anima el chat cuando m\u00e1s hace falta',
      'es de los que nunca fallan cuando los necesitas',
    ];
    const halago = halagos[Math.floor(Math.random() * halagos.length)];

    return new EmbedBuilder()
      .setTitle('\ud83d\udce2 Shoutout Random')
      .setDescription(
        `Alguien en esta familia **${halago}**.\n\n` +
        `\u00bfQui\u00e9n creen que es? \ud83d\udc40`
      )
      .setColor('#9B59B6');
  },

  // Datos curiosos (Trivia)
  () => {
    const curiosidades = [
      'El primer nombre de Pac-Man iba a ser "Puck-Man", pero lo cambiaron por miedo a que vandalizaran las m\u00e1quinas cambiando la P por una F.',
      'El coraz\u00f3n de un camar\u00f3n est\u00e1 en su cabeza.',
      'Hay m\u00e1s posibles iteraciones de una partida de ajedrez que \u00e1tomos en el universo observable.',
      'La persona promedio pasar\u00e1 seis meses de su vida esperando en sem\u00e1foros en rojo.',
      'Las vacas tienen mejores amigas y se estresan cuando las separan.',
      'El agujero de los bol\u00edgrafos Bic est\u00e1 dise\u00f1ado para evitar que te ahogues si te lo tragas accidentalmente.',
      'Nintendo fue fundada en 1889. Empezaron vendiendo cartas de papel tradicionales japonesas.',
      'Si gritas durante 8 a\u00f1os, 7 meses y 6 d\u00edas, habr\u00e1s producido suficiente energ\u00eda sonora para calentar una taza de caf\u00e9.',
    ];
    const trivia = curiosidades[Math.floor(Math.random() * curiosidades.length)];

    return new EmbedBuilder()
      .setTitle('\ud83e\udde0 \u00bfSab\u00edas que...?')
      .setDescription(
        `**Dato curioso random:**\n\n` +
        `> ${trivia}\n\n` +
        `\ud83e\udd2f *Cada d\u00eda se aprende algo nuevo.*`
      )
      .setColor('#10B981');
  },
];

// Tipos de eventos (como antes, pero mejorados)
const TIPOS_EVENTO = [
  'frase_random',
  'lore_callback',
  'generado',
  'tematico',
  'reaccion_tarde',
];

async function ejecutarEventoRandom(guild, guildConfig) {
  if (!enHorarioActivo()) return;

  const totalFrases = db_frases.total();
  const totalLore = db_lore.total();

  const canal = await getCanalActivo(guild);
  if (!canal) return;

  // Cooldown: no spamear el mismo canal
  if (db_historial.respondioReciente(canal.id, 60 * 5)) return; // 5 min cooldown

  const tipo = TIPOS_EVENTO[Math.floor(Math.random() * TIPOS_EVENTO.length)];

  try {
    switch (tipo) {
      case 'tematico': {
        const eventoFn = EVENTOS_TEMATICOS[Math.floor(Math.random() * EVENTOS_TEMATICOS.length)];
        const embed = eventoFn();
        await canal.send({ embeds: [embed] });
        break;
      }

      case 'frase_random': {
        if (totalFrases === 0) return;
        const frase = db_frases.obtenerRandom();
        if (!frase) break;
        await canal.send(`"${frase.texto}"`);
        db_frases.marcarUsada(frase.id);
        break;
      }

      case 'lore_callback':
      case 'generado': {
        if (totalFrases === 0 && totalLore === 0) return;
        const mensaje = await generarEventoRandom(guildConfig);
        if (mensaje) await canal.send(mensaje);
        break;
      }

      case 'reaccion_tarde': {
        if (totalFrases === 0) return;
        const frase = db_frases.obtenerRandom();
        if (!frase) break;
        const prefijos = [
          'espera—',
          'un momento.',
          'oye,',
          'acabo de recordar:',
          'nada, solo que',
        ];
        const prefijo = prefijos[Math.floor(Math.random() * prefijos.length)];
        await canal.send(`${prefijo} "${frase.texto}"`);
        break;
      }
    }

    db_historial.registrar('random', null, canal.id);
    console.log(`[RandomEvent] Evento "${tipo}" en #${canal.name}`);
  } catch (error) {
    console.error('[RandomEvent] Error al enviar:', error.message);
  }
}

// Programar el siguiente evento recursivamente
export function iniciarEventosRandom(client) {
  console.log('[RandomEvent] Sistema de eventos random activado.');

  const programarSiguiente = () => {
    const intervalo = getIntervaloRandom();
    const minutosHasta = Math.round(intervalo / 60000);
    console.log(`[RandomEvent] Próximo evento en ~${minutosHasta} minutos.`);

    setTimeout(async () => {
      for (const guild of client.guilds.cache.values()) {
        const { db_config } = await import('../memory/database.js');
        const config = db_config.obtener(guild.id);
        if (config.activo) {
          await ejecutarEventoRandom(guild, config);
        }
      }

      programarSiguiente(); // Reprogramar
    }, intervalo);
  };

  programarSiguiente();
}
