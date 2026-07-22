// src/commands/index.js
// Comandos slash del bot — Lush Family

import { SlashCommandBuilder, EmbedBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } from 'discord.js';
import { db_frases, db_lore, db_triggers, db_config, db_economia, db_cooldowns, db_nombres, db_memorias } from '../memory/database.js';
import { responderMensaje, consultarGemini } from '../memory/brain.js';

import { handleJob, handleVender } from '../jobs.js';
import { buildShopEmbed, handleComprar, addLibro } from '../shop.js';
import { handleSlots, handleCoinflip, handleDados, handleRuleta, handleBlackjack } from '../casino.js';
import { handlePPT, handle8Ball, handleAdivina, handleShip, handleDuelo } from '../minigames.js';
import { getAnuncio } from '../announcements.js';
import { handleSaldo, handleDepositar, handleRetirar, handleTransferir, handleRobar } from '../bank.js';
import { calcularNivel, obtenerTitulo, xpParaNivel, embedPerfil } from '../levels.js';
import db from '../memory/database.js';
import { handleRoleplayCommand, handleCasarse, handleDivorciarse, handlePareja } from '../roleplay.js';

// ─── DEFINICIÓN DE COMANDOS ────────────────────────────────────────────────

export const commands = [


  new SlashCommandBuilder()
    .setName('confesion')
    .setDescription('Envía una confesión anónima al canal de confesiones')
    .addStringOption(opt =>
      opt.setName('mensaje')
        .setDescription('Tu confesión (será 100% anónima)')
        .setRequired(true))
    .toJSON(),

  new SlashCommandBuilder()
    .setName('vincular')
    .setDescription('Vincula tu nick de Audition y preséntate a la familia')
    .toJSON(),

  new SlashCommandBuilder()
    .setName('perfil')
    .setDescription('Mira tu perfil: nivel, título, monedas y más')
    .toJSON(),

  new SlashCommandBuilder()
    .setName('top')
    .setDescription('Ranking de la familia')
    .toJSON(),

  new SlashCommandBuilder()
    .setName('trabajar')
    .setDescription('Trabaja un rato para ganar Monedas')
    .toJSON(),

  new SlashCommandBuilder()
    .setName('minar')
    .setDescription('Ve a la mina')
    .toJSON(),

  new SlashCommandBuilder()
    .setName('pescar')
    .setDescription('Lanza la caña al lago')
    .toJSON(),

  new SlashCommandBuilder()
    .setName('farmear')
    .setDescription('Planta y cosecha')
    .toJSON(),

  new SlashCommandBuilder()
    .setName('vender')
    .setDescription('Vende recursos')
    .toJSON(),



  new SlashCommandBuilder()
    .setName('recomendar')
    .setDescription('Recomendación anime/manga')
    .toJSON(),

  new SlashCommandBuilder()
    .setName('resena')
    .setDescription('Reseña sin spoilers')
    .toJSON(),


  // TIENDA
  new SlashCommandBuilder()
    .setName('tienda')
    .setDescription('Abre la Tienda Lush para gastar tus monedas')
    .toJSON(),

  new SlashCommandBuilder()
    .setName('comprar')
    .setDescription('Compra un item de la tienda')
    .addStringOption(opt =>
      opt.setName('item')
        .setDescription('ID del item (ver /tienda)')
        .setRequired(true))
    .toJSON(),

  new SlashCommandBuilder()
    .setName('tienda-add')
    .setDescription('[ADMIN] Añade un libro/PDF a la tienda')
    .addStringOption(opt =>
      opt.setName('titulo')
        .setDescription('Nombre del libro')
        .setRequired(true))
    .addIntegerOption(opt =>
      opt.setName('precio')
        .setDescription('Precio en monedas')
        .setRequired(true))
    .addStringOption(opt =>
      opt.setName('link')
        .setDescription('Link de descarga (Google Drive, etc.)')
        .setRequired(true))
    .toJSON(),

  // CASINO
  new SlashCommandBuilder()
    .setName('slots')
    .setDescription('🎰 Máquina tragamonedas')
    .addIntegerOption(opt =>
      opt.setName('apuesta').setDescription('Monedas a apostar (mín. 10)').setRequired(true))
    .toJSON(),

  new SlashCommandBuilder()
    .setName('coinflip')
    .setDescription('🪙 Lanza una moneda — cara o cruz')
    .addIntegerOption(opt =>
      opt.setName('apuesta').setDescription('Monedas a apostar').setRequired(true))
    .addStringOption(opt =>
      opt.setName('lado').setDescription('Cara o Cruz').setRequired(true)
        .addChoices({ name: '🪙 Cara', value: 'cara' }, { name: '💀 Cruz', value: 'cruz' }))
    .toJSON(),

  new SlashCommandBuilder()
    .setName('dados')
    .setDescription('🎲 Tira dados contra el bot')
    .addIntegerOption(opt =>
      opt.setName('apuesta').setDescription('Monedas a apostar').setRequired(true))
    .toJSON(),

  new SlashCommandBuilder()
    .setName('ruleta')
    .setDescription('🎡 Ruleta — apuesta a un color')
    .addIntegerOption(opt =>
      opt.setName('apuesta').setDescription('Monedas a apostar').setRequired(true))
    .addStringOption(opt =>
      opt.setName('color').setDescription('Color a apostar').setRequired(true)
        .addChoices(
          { name: '🔴 Rojo (x2)', value: 'rojo' },
          { name: '⚫ Negro (x2)', value: 'negro' },
          { name: '🟢 Verde (x14)', value: 'verde' },
        ))
    .toJSON(),

  new SlashCommandBuilder()
    .setName('blackjack')
    .setDescription('🃏 Blackjack — intenta llegar a 21')
    .addIntegerOption(opt =>
      opt.setName('apuesta').setDescription('Monedas a apostar').setRequired(true))
    .toJSON(),

  // INFO
  new SlashCommandBuilder()
    .setName('guia')
    .setDescription('Muestra la guía completa de comandos del bot')
    .toJSON(),

  new SlashCommandBuilder()
    .setName('reglas')
    .setDescription('Muestra las reglas del server')
    .toJSON(),

  // MINIJUEGOS
  new SlashCommandBuilder()
    .setName('ppt')
    .setDescription('✊ Piedra, Papel o Tijeras')
    .addStringOption(opt =>
      opt.setName('jugada').setDescription('Tu jugada').setRequired(true)
        .addChoices(
          { name: '🪨 Piedra', value: 'piedra' },
          { name: '📄 Papel', value: 'papel' },
          { name: '✂️ Tijeras', value: 'tijeras' },
        ))
    .toJSON(),

  new SlashCommandBuilder()
    .setName('8ball')
    .setDescription('🎱 Pregúntale a la bola mágica')
    .addStringOption(opt =>
      opt.setName('pregunta').setDescription('Tu pregunta').setRequired(true))
    .toJSON(),

  new SlashCommandBuilder()
    .setName('adivina')
    .setDescription('🔢 Adivina el número del 1 al 10')
    .addIntegerOption(opt =>
      opt.setName('numero').setDescription('Tu número (1-10)').setRequired(true)
        .setMinValue(1).setMaxValue(10))
    .toJSON(),

  new SlashCommandBuilder()
    .setName('ship')
    .setDescription('💕 Compatibilidad entre dos personas')
    .addUserOption(opt => opt.setName('persona1').setDescription('Primera persona').setRequired(true))
    .addUserOption(opt => opt.setName('persona2').setDescription('Segunda persona').setRequired(true))
    .toJSON(),

  new SlashCommandBuilder()
    .setName('duelo')
    .setDescription('⚔️ Reta a alguien a un duelo')
    .addUserOption(opt => opt.setName('usuario').setDescription('A quién retas').setRequired(true))
    .toJSON(),

  // ADMIN
  new SlashCommandBuilder()
    .setName('setup-canales')
    .setDescription('[ADMIN] Crea toda la estructura de categorías y canales del servidor')
    .toJSON(),

  new SlashCommandBuilder()
    .setName('setup-mensajes')
    .setDescription('[ADMIN] El bot enviará automáticamente los mensajes de información en cada canal')
    .toJSON(),

  new SlashCommandBuilder()
    .setName('setup-verificacion')
    .setDescription('[ADMIN] Configura los permisos para que los nuevos solo vean el canal de inicio')
    .toJSON(),

  new SlashCommandBuilder()
    .setName('forzar-onboarding')
    .setDescription('[ADMIN] Obliga a TODOS los miembros a verificarse con nick y presentación')
    .toJSON(),

  new SlashCommandBuilder()
    .setName('anuncio')
    .setDescription('[ADMIN] Publica un embed de anuncio')
    .addStringOption(opt =>
      opt.setName('tipo').setDescription('Tipo de anuncio').setRequired(true)
        .addChoices(
          { name: '🐟 Principal (Bienvenida)', value: 'principal' },
          { name: '🎨 Elige tu Rol', value: 'roles' },
          { name: '😂 Memes', value: 'memes' },
          { name: '📸 Capturas', value: 'capturas' },
          { name: '💬 Off-Topic', value: 'offtopic' },
          { name: '🎮 Minijuegos', value: 'minijuegos' },
          { name: '💼 Economía', value: 'economia' },
          { name: '🏦 Banco', value: 'banco' },
          { name: '📜 Reglas', value: 'reglas' },
          { name: '📖 Guías', value: 'guias' },
          { name: '🌍 Redes Sociales', value: 'redes' },
          { name: '👋 Presentación', value: 'presentacion' },
          { name: '🤫 Confesiones', value: 'confesiones' },
          { name: '📚 Libros', value: 'libros' },
          { name: '🗺️ Directorio de Canales', value: 'directorio' },
        ))
    .addChannelOption(opt =>
      opt.setName('canal').setDescription('Canal donde enviar el anuncio (por defecto el actual)').setRequired(false)
    )
    .toJSON(),

  // BANCO
  new SlashCommandBuilder()
    .setName('saldo')
    .setDescription('🏦 Ve tu billetera y banco')
    .toJSON(),

  new SlashCommandBuilder()
    .setName('depositar')
    .setDescription('🏦 Deposita monedas en el banco (seguras)')
    .addIntegerOption(opt =>
      opt.setName('cantidad').setDescription('Cantidad a depositar').setRequired(true).setMinValue(1))
    .toJSON(),

  new SlashCommandBuilder()
    .setName('retirar')
    .setDescription('🏦 Retira monedas del banco')
    .addIntegerOption(opt =>
      opt.setName('cantidad').setDescription('Cantidad a retirar').setRequired(true).setMinValue(1))
    .toJSON(),

  new SlashCommandBuilder()
    .setName('transferir')
    .setDescription('💸 Transfiere monedas a alguien')
    .addUserOption(opt => opt.setName('usuario').setDescription('A quién').setRequired(true))
    .addIntegerOption(opt =>
      opt.setName('cantidad').setDescription('Cantidad').setRequired(true).setMinValue(1))
    .toJSON(),

  new SlashCommandBuilder()
    .setName('robar')
    .setDescription('🦹 Intenta robar de la billetera de alguien')
    .addUserOption(opt => opt.setName('usuario').setDescription('A quién robar').setRequired(true))
    .toJSON(),

  // ROLEPLAY & MARRIAGE
  new SlashCommandBuilder()
    .setName('casarse')
    .setDescription('💍 Propón matrimonio a un miembro de la familia')
    .addUserOption(opt => opt.setName('usuario').setDescription('El amor de tu vida').setRequired(true))
    .toJSON(),

  new SlashCommandBuilder()
    .setName('divorciarse')
    .setDescription('💔 Rompe tu relación matrimonial')
    .toJSON(),

  new SlashCommandBuilder()
    .setName('pareja')
    .setDescription('💖 Consulta tu pareja o la de alguien más')
    .addUserOption(opt => opt.setName('usuario').setDescription('Usuario a consultar').setRequired(false))
    .toJSON(),

  new SlashCommandBuilder()
    .setName('abrazar')
    .setDescription('🤗 Dale un fuerte abrazo a alguien')
    .addUserOption(opt => opt.setName('usuario').setDescription('A quién abrazar').setRequired(true))
    .toJSON(),

  new SlashCommandBuilder()
    .setName('besar')
    .setDescription('💋 Dale un tierno beso a alguien')
    .addUserOption(opt => opt.setName('usuario').setDescription('A quién besar').setRequired(true))
    .toJSON(),

  new SlashCommandBuilder()
    .setName('patear')
    .setDescription('👣 Patea a alguien')
    .addUserOption(opt => opt.setName('usuario').setDescription('A quién patear').setRequired(true))
    .toJSON(),

  new SlashCommandBuilder()
    .setName('bofetada')
    .setDescription('🖐️ Dale una cachetada a alguien')
    .addUserOption(opt => opt.setName('usuario').setDescription('A quién cachetear').setRequired(true))
    .toJSON(),

  new SlashCommandBuilder()
    .setName('acariciar')
    .setDescription('😊 Acaricia la cabeza de alguien')
    .addUserOption(opt => opt.setName('usuario').setDescription('A quién mimar').setRequired(true))
    .toJSON(),

  new SlashCommandBuilder()
    .setName('morder')
    .setDescription('🦷 Dale una mordida a alguien')
    .addUserOption(opt => opt.setName('usuario').setDescription('A quién morder').setRequired(true))
    .toJSON(),

  new SlashCommandBuilder()
    .setName('matar')
    .setDescription('💀 Elimina a alguien en broma')
    .addUserOption(opt => opt.setName('usuario').setDescription('A quién eliminar').setRequired(true))
    .toJSON(),

  new SlashCommandBuilder()
    .setName('bailar')
    .setDescription('💃 ¡A bailar!')
    .addUserOption(opt => opt.setName('usuario').setDescription('Con quién bailar (opcional)').setRequired(false))
    .toJSON(),

  new SlashCommandBuilder()
    .setName('suplex')
    .setDescription('🤼 Aplícale un suplex brutal a alguien')
    .addUserOption(opt => opt.setName('usuario').setDescription('A quién aplicarle el suplex').setRequired(true))
    .toJSON(),

  new SlashCommandBuilder()
    .setName('punete')
    .setDescription('👊 Dale un puñete a alguien')
    .addUserOption(opt => opt.setName('usuario').setDescription('A quién golpear').setRequired(true))
    .toJSON(),

  new SlashCommandBuilder()
    .setName('esquivar')
    .setDescription('💨 Esquiva un ataque con estilo')
    .addUserOption(opt => opt.setName('usuario').setDescription('De quién esquivar el ataque').setRequired(true))
    .toJSON(),

  new SlashCommandBuilder()
    .setName('esconderse')
    .setDescription('🫣 Escóndete de alguien o escóndete solo')
    .addUserOption(opt => opt.setName('usuario').setDescription('De quién esconderte (opcional)').setRequired(false))
    .toJSON(),

  // MEMORY COMMANDS
  new SlashCommandBuilder()
    .setName('llamame')
    .setDescription('🗣️ Configura cómo debe llamarte el bot')
    .addStringOption(opt => opt.setName('nombre').setDescription('El nombre o apodo que quieres que use el bot').setRequired(true).setMaxLength(40))
    .toJSON(),

  new SlashCommandBuilder()
    .setName('recuerdame')
    .setDescription('🧠 Guarda un dato sobre ti en la memoria del bot')
    .addStringOption(opt => opt.setName('dato').setDescription('Ej: Me gusta el café, juego en modo coreo, etc.').setRequired(true).setMaxLength(200))
    .toJSON(),

  new SlashCommandBuilder()
    .setName('mis-recuerdos')
    .setDescription('📖 Muestra todo lo que el bot recuerda sobre ti')
    .toJSON(),

  new SlashCommandBuilder()
    .setName('olvidame')
    .setDescription('🧹 Borra tu nombre y todos tus recuerdos de la base de datos del bot')
    .toJSON(),

  // GENERAL MEMORY LORE COMMANDS
  new SlashCommandBuilder()
    .setName('aprender')
    .setDescription('🧠 Enséñale al bot un hecho o recuerdo general sobre el clan/servidor')
    .addStringOption(opt => opt.setName('hecho').setDescription('Ej: El aniversario de la familia es en octubre, etc.').setRequired(true).setMaxLength(300))
    .toJSON(),

  new SlashCommandBuilder()
    .setName('hechos')
    .setDescription('📖 Muestra la lista de hechos generales y lore que el bot ha aprendido')
    .toJSON(),

  new SlashCommandBuilder()
    .setName('olvidar-hecho')
    .setDescription('🧹 Haz que el bot olvide un hecho general que haya aprendido')
    .addStringOption(opt => opt.setName('busqueda').setDescription('Parte del texto del hecho que quieres borrar').setRequired(true).setMaxLength(100))
    .toJSON(),
];

function normalizeText(text) {
  let res = '';
  for (const char of text) {
    const cp = char.codePointAt(0);
    if (cp >= 0x1D400 && cp <= 0x1D419) res += String.fromCodePoint(cp - 0x1D400 + 65);
    else if (cp >= 0x1D41A && cp <= 0x1D433) res += String.fromCodePoint(cp - 0x1D41A + 97);
    else if (cp >= 0x1D434 && cp <= 0x1D44D) res += String.fromCodePoint(cp - 0x1D434 + 65);
    else if (cp >= 0x1D44E && cp <= 0x1D467) res += String.fromCodePoint(cp - 0x1D44E + 97);
    else if (cp >= 0x1D468 && cp <= 0x1D481) res += String.fromCodePoint(cp - 0x1D468 + 65);
    else if (cp >= 0x1D482 && cp <= 0x1D49B) res += String.fromCodePoint(cp - 0x1D482 + 97);
    else if (cp >= 0x1D5A0 && cp <= 0x1D5B9) res += String.fromCodePoint(cp - 0x1D5A0 + 65);
    else if (cp >= 0x1D5BA && cp <= 0x1D5D3) res += String.fromCodePoint(cp - 0x1D5BA + 97);
    else if (cp >= 0x1D5D4 && cp <= 0x1D5ED) res += String.fromCodePoint(cp - 0x1D5D4 + 65);
    else if (cp >= 0x1D5EE && cp <= 0x1D607) res += String.fromCodePoint(cp - 0x1D5EE + 97);
    else if (cp >= 0x1D670 && cp <= 0x1D689) res += String.fromCodePoint(cp - 0x1D670 + 65);
    else if (cp >= 0x1D68A && cp <= 0x1D6A3) res += String.fromCodePoint(cp - 0x1D68A + 97);
    else res += char;
  }
  return res.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

function esAdmin(member) {
  if (member.permissions.has('Administrator')) return true;
  return member.roles.cache.some(r => {
    const normalized = normalizeText(r.name);
    return normalized.includes('founder') || normalized.includes('admin');
  });
}

export function getGuiaEmbed(category, botAvatar) {
  switch (category) {
    case 'inicio':
      return new EmbedBuilder()
        .setTitle('📚 Lush Bot — Guía de Comandos')
        .setDescription('Usa el menú desplegable de abajo para explorar todas las secciones del bot. ¡Elige una categoría para ver sus comandos!')
        .setColor('#FF6B35')
        .setThumbnail(botAvatar)
        .setTimestamp();

    case 'memoria':
      return new EmbedBuilder()
        .setTitle('🧠 Familia & Memoria (IA)')
        .setColor('#9B59B6')
        .setDescription('El bot aprende de la comunidad y posee inteligencia artificial.')
        .addFields(
          { name: '/frase <texto>', value: 'Guarda una frase legendaria del servidor', inline: true },
          { name: '/lore <historia>', value: 'Guarda un momento épico de la familia', inline: true },
          { name: '/trigger <palabra>', value: 'Agrega una palabra clave que me activa', inline: true },
          { name: '/recuerdo', value: 'Saca una frase o lore aleatorio de la base de datos', inline: true },
          { name: '💬 Conversación con IA', value: 'Mencióname (`@Lush Bot`) o usa mi nombre en tu mensaje para chatear conmigo.', inline: false }
        );

    case 'economia':
      return new EmbedBuilder()
        .setTitle('💼 Economía & Banco')
        .setColor('#F59E0B')
        .setDescription('Gana monedas trabajando o recolectando recursos, y guárdalas seguras en tu cuenta.')
        .addFields(
          { name: '/perfil', value: 'Mira tu dinero, nivel, XP y título actual', inline: true },
          { name: '/trabajar', value: 'Trabaja un rato para ganar monedas (cada 30 min)', inline: true },
          { name: '/minar', value: '⛏️ Ve a la mina a recolectar minerales', inline: true },
          { name: '/pescar', value: '🎣 Pesca en el lago', inline: true },
          { name: '/farmear', value: '🌾 Siembra y cosecha en tu granja', inline: true },
          { name: '/vender', value: 'Vende todos tus recursos acumulados por monedas', inline: true },
          { name: '/saldo', value: '🏦 Consulta tu billetera y tu cuenta bancaria', inline: true },
          { name: '/depositar <cantidad>', value: '🏦 Guarda tus monedas seguras en el banco', inline: true },
          { name: '/retirar <cantidad>', value: '🏦 Saca monedas del banco a tu billetera', inline: true },
          { name: '/transferir <usuario> <cantidad>', value: '💸 Págale monedas a otro usuario', inline: true },
          { name: '/robar <usuario>', value: '🦹 Intenta robarle a alguien (¡Cuidado con la multa!)', inline: true }
        )
        .setFooter({ text: '⏳ Cooldown de recolección: 5 minutos • Depósitos en banco evitan robos' });

    case 'casino':
      return new EmbedBuilder()
        .setTitle('🎰 Casino & Minijuegos')
        .setColor('#EF4444')
        .setDescription('¡Apuesta tus monedas o juega con tus amigos en el chat!')
        .addFields(
          { name: '/slots <apuesta>', value: '🎰 Tragamonedas — ¡Triple 7️⃣ paga x10 Jackpot!', inline: true },
          { name: '/coinflip <apuesta>', value: '🪙 Lanza una moneda — Cara o Cruz (50% de probabilidad)', inline: true },
          { name: '/dados <apuesta>', value: '🎲 Tira dados contra el bot — la mayor suma gana', inline: true },
          { name: '/ruleta <apuesta> <color>', value: '🎡 Apuesta: Rojo/Negro (x2) o Verde (x14)', inline: true },
          { name: '/blackjack <apuesta>', value: '🃏 Juega Blackjack clásico con botones interactivos', inline: true },
          { name: '/ppt <opcion>', value: '✊ Juega Piedra, Papel o Tijeras contra el bot', inline: true },
          { name: '/8ball <pregunta>', value: '🎱 Hazle una pregunta a la bola mágica', inline: true },
          { name: '/adivina', value: '🔢 Intenta adivinar el número secreto (1 al 10)', inline: true },
          { name: '/ship <usuario>', value: '💕 Mide la compatibilidad de amor entre dos personas', inline: true },
          { name: '/duelo <usuario> <apuesta>', value: '⚔️ Reta a alguien a un duelo por monedas', inline: true }
        )
        .setFooter({ text: '💰 Apuesta mínima: 10 • máxima: 50,000' });

    case 'social':
      return new EmbedBuilder()
        .setTitle('🎭 Social & Roleplay')
        .setColor('#E91E63')
        .setDescription('Interactúa con otros usuarios en el servidor usando comandos visuales con GIFs.')
        .addFields(
          { name: '/casarse @usuario', value: '💍 Propón matrimonio (con botones de aceptación)', inline: true },
          { name: '/divorciarse', value: '💔 Divórciate de tu pareja actual', inline: true },
          { name: '/pareja [@usuario]', value: '💖 Consulta tu pareja o la de alguien más (con avatares)', inline: true },
          { name: '/abrazar @usuario', value: '🤗 Abraza a alguien', inline: true },
          { name: '/besar @usuario', value: '💋 Dale un tierno beso a alguien', inline: true },
          { name: '/patear @usuario', value: '👣 Dale una patada a alguien', inline: true },
          { name: '/punete @usuario', value: '👊 Dale un fuerte puñetazo', inline: true },
          { name: '/suplex @usuario', value: '🤼 Aplícale un suplex de lucha libre', inline: true },
          { name: '/bofetada @usuario', value: '🖐️ Métele una bofetada', inline: true },
          { name: '/acariciar @usuario', value: '😊 Acaricia su cabeza', inline: true },
          { name: '/morder @usuario', value: '🦷 Muerde a alguien', inline: true },
          { name: '/matar @usuario', value: '💀 Elimina a alguien en broma', inline: true },
          { name: '/esquivar @usuario', value: '💨 Esquiva un ataque', inline: true },
          { name: '/esconderse [@usuario]', value: '🫣 Escóndete de alguien o métete en una caja', inline: true },
          { name: '/bailar [@usuario]', value: '💃 Baila solo o saca los pasos prohibidos en pareja', inline: true },
          { name: '💬 Acciones por texto', value: 'También puedes escribir directo en el chat sin el `/` (ej. *"patea a @Nocturne"*, *"Lushbot baila"*).', inline: false }
        );

    case 'niveles':
      return new EmbedBuilder()
        .setTitle('📊 Niveles & Rangos')
        .setColor('#8B5CF6')
        .setDescription(
          'Gana experiencia (XP) de forma activa enviando mensajes en los canales de texto. ¡Sube de nivel y desbloquea rangos especiales!\n\n' +
          '```\n' +
          'Lv.1  → Novato del Chat\n' +
          'Lv.5  → Miembro Casual\n' +
          'Lv.10 → Combo Breaker\n' +
          'Lv.15 → Freestyler\n' +
          'Lv.20 → Leyenda Lush\n' +
          'Lv.25 → Icono del Chat\n' +
          'Lv.30 → Dios del Server\n' +
          '```'
        )
        .setFooter({ text: 'Lush Family • ¡Sube de rango chateando! 🎮' });
  }
}

// ─── HANDLER ────────────────────────────────────────────────────────────────

export async function handleCommand(interaction) {
  const { commandName } = interaction;

  // ─── RESTRICCIÓN POR CANAL ──────────────────────────────────────────────
  // Mapea comandos a palabras clave del nombre del canal donde deben usarse.
  // Si el nombre del canal no contiene la keyword, se rechaza.
  // Los comandos que NO están aquí funcionan en cualquier canal.

  const CANAL_REQUERIDO = {


    // Casino → canal con "casino"
    slots: 'casino',
    coinflip: 'casino',
    dados: 'casino',
    ruleta: 'casino',
    blackjack: 'casino',

    // Banco → canal con "banco" o "bank"
    saldo: 'banco|bank',
    depositar: 'banco|bank',
    retirar: 'banco|bank',
    transferir: 'banco|bank',

    // Economía → canal con "econom" o "trabajo" o "tienda"
    trabajar: 'econom|trabajo|tienda',
    minar: 'econom|trabajo|tienda',
    pescar: 'econom|trabajo|tienda',
    farmear: 'econom|trabajo|tienda',
    vender: 'econom|trabajo|tienda',
    tienda: 'econom|trabajo|tienda',
    comprar: 'econom|trabajo|tienda',

    // Minijuegos → canal con "minijuego" o "juego" o "games"
    ppt: 'minijuego|juego|games',
    '8ball': 'minijuego|juego|games',
    adivina: 'minijuego|juego|games',
    ship: 'minijuego|juego|games',
    duelo: 'minijuego|juego|games',

    // robar -> SIN RESTRICCIÓN (funciona en cualquier canal)
    // confesion -> SIN RESTRICCIÓN (se envía internamente al canal de confesiones)
  };

  const restriccion = CANAL_REQUERIDO[commandName];
  if (restriccion) {
    if (!interaction.guild || !interaction.channel) {
       return interaction.reply({ content: '❌ Este comando solo funciona en un servidor.', ephemeral: true });
    }
    const canal = (interaction.channel.name || '').toLowerCase();
    const keywords = restriccion.split('|');
    const permitido = keywords.some(kw => canal.includes(kw));

    if (!permitido) {
      // Buscar el canal correcto para sugerir
      const canalSugerido = interaction.guild.channels.cache.find(ch =>
        keywords.some(kw => (ch.name || '').toLowerCase().includes(kw))
      );
      const sugerencia = canalSugerido ? `<#${canalSugerido.id}>` : `un canal con "${keywords[0]}" en su nombre`;

      let components = [];
      if (canalSugerido) {
        const btn = new ButtonBuilder()
          .setLabel('Ir al canal')
          .setURL(`https://discord.com/channels/${interaction.guild.id}/${canalSugerido.id}`)
          .setStyle(ButtonStyle.Link);
        components = [new ActionRowBuilder().addComponents(btn)];
      }

      return interaction.reply({
        content: `❌ Este comando debe usarse en ${sugerencia}.`,
        components: components.length > 0 ? components : undefined,
        ephemeral: true,
      });
    }
  }

  switch (commandName) {


    case 'confesion': {
      const mensaje = interaction.options.getString('mensaje');
      
      if (!interaction.guild) {
        return interaction.reply({ content: '❌ Este comando solo funciona en servidores.', ephemeral: true });
      }

      const confessionChannel = interaction.guild.channels.cache.find(ch => ch.name.toLowerCase().includes('confesion'));
      
      if (!confessionChannel) {
        return interaction.reply({ content: '❌ No se encontró un canal de confesiones en el servidor (debe tener "confesion" en el nombre).', ephemeral: true });
      }

      await interaction.reply({
        content: `✅ Tu confesión ha sido enviada anónimamente a <#${confessionChannel.id}>. Nadie sabrá que fuiste tú.`,
        ephemeral: true
      });

      const embed = new EmbedBuilder()
        .setTitle('🤫 Nueva Confesión')
        .setDescription(mensaje)
        .setColor('#8E44AD')
        .setTimestamp();
        
      if (typeof confessionChannel.send === 'function') {
        return confessionChannel.send({ embeds: [embed] });
      } else {
        return console.error('[Confesion] Error: No se pudo enviar el mensaje, el canal de confesiones no tiene el método send.');
      }
    }

    case 'vincular': {
      // Abrir modal de presentación
      const modal = new ModalBuilder()
        .setCustomId('modal_vincular')
        .setTitle('🎮 Vincula tu cuenta de Audition');

      const nickInput = new TextInputBuilder()
        .setCustomId('input_nick')
        .setLabel('Tu nickname en Audition Latino')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('Ej: xXLushXx')
        .setRequired(true)
        .setMinLength(2)
        .setMaxLength(30);

      const presentacionInput = new TextInputBuilder()
        .setCustomId('input_presentacion')
        .setLabel('Preséntate a la familia 👋')
        .setStyle(TextInputStyle.Paragraph)
        .setPlaceholder('Escribe tu nombre, edad, país, modo favorito en Audition...')
        .setRequired(true)
        .setMinLength(10)
        .setMaxLength(800);

      modal.addComponents(
        new ActionRowBuilder().addComponents(nickInput),
        new ActionRowBuilder().addComponents(presentacionInput)
      );

      return interaction.showModal(modal);
    }

    // ═══════════════════════════════════════════════════════════════
    // 📊 NIVELES & PERFIL
    // ═══════════════════════════════════════════════════════════════

    case 'perfil': {
      const perfil = db_economia.obtener(interaction.user.id);
      const embed = embedPerfil(interaction.user, perfil.monedas);
      return interaction.reply({ embeds: [embed] });
    }

    case 'top': {
      const rows = db.prepare(`
        SELECT user_id, experiencia, monedas 
        FROM economia 
        ORDER BY experiencia DESC 
        LIMIT 10
      `).all();

      if (rows.length === 0) {
        return interaction.reply({ content: 'Nadie ha ganado experiencia todavía.', ephemeral: true });
      }

      let leaderboard = '';
      const medals = ['🥇', '🥈', '🥉'];

      for (let i = 0; i < rows.length; i++) {
        const r = rows[i];
        const nivel = calcularNivel(r.experiencia);
        const titulo = obtenerTitulo(nivel);
        const medal = medals[i] || `**${i + 1}.**`;
        leaderboard += `${medal} <@${r.user_id}> — Nv.${nivel} (${titulo}) | ${r.monedas} 💰\n`;
      }

      const embed = new EmbedBuilder()
        .setTitle('🏆 Ranking Lush Family')
        .setDescription(leaderboard)
        .setColor('#FFD700')
        .setTimestamp();
      return interaction.reply({ embeds: [embed] });
    }

    // ═══════════════════════════════════════════════════════════════
    // 💼 TRABAJOS & ECONOMÍA
    // ═══════════════════════════════════════════════════════════════

    case 'trabajar': {
      const userId = interaction.user.id;
      const perfil = db_economia.obtener(userId);
      const ahora = Math.floor(Date.now() / 1000);
      const cooldown = 30 * 60; // 30 minutos

      if (perfil.ultimo_trabajo && (ahora - perfil.ultimo_trabajo) < cooldown) {
        const faltan = cooldown - (ahora - perfil.ultimo_trabajo);
        const min = Math.floor(faltan / 60);
        const sec = faltan % 60;
        return interaction.reply({
          content: `⏳ Ya trabajaste hace poco. Espera **${min}m ${sec}s**.`,
          ephemeral: true
        });
      }

      const ganancia = Math.floor(Math.random() * 50) + 20; // 20-70 monedas
      db_economia.agregarMonedas(userId, ganancia);
      db_economia.actualizarTrabajo(userId);

      const trabajos = [
        `Hiciste de streamer por unas horas y ganaste **${ganancia}** 💰`,
        `Vendiste cosas en línea y ganaste **${ganancia}** 💰`,
        `Diste clases particulares y ganaste **${ganancia}** 💰`,
        `Organizaste un evento en el server y ganaste **${ganancia}** 💰`,
        `Hiciste un encargo express y ganaste **${ganancia}** 💰`,
      ];

      return interaction.reply(trabajos[Math.floor(Math.random() * trabajos.length)]);
    }

    case 'minar': {
      return handleJob(interaction, 'minar');
    }

    case 'pescar': {
      return handleJob(interaction, 'pescar');
    }

    case 'farmear': {
      return handleJob(interaction, 'farmear');
    }

    case 'vender': {
      return handleVender(interaction);
    }

    // ═══════════════════════════════════════════════════════════════
    // 🎮 MINI-JUEGOS CON IA
    // ═══════════════════════════════════════════════════════════════

    case 'recomendar': {
      await interaction.deferReply();
      try {
        const respuesta = await consultarGemini(
          'Recomienda un anime o manga poco conocido pero bueno. Incluye: nombre, género, sinopsis corta (sin spoilers), y por qué vale la pena. Máximo 5 líneas, en español.'
        );
        const embed = new EmbedBuilder()
          .setTitle('📺 Recomendación Anime/Manga')
          .setDescription(respuesta)
          .setColor('#FF6600')
          .setTimestamp();
        return interaction.editReply({ embeds: [embed] });
      } catch {
        return interaction.editReply('No se me ocurre nada ahorita, pregunta después.');
      }
    }

    case 'resena': {
      await interaction.deferReply();
      try {
        const respuesta = await consultarGemini(
          'Escribe una mini reseña (sin spoilers) de un anime o serie popular que le pueda gustar a un grupo de gamers latinos jóvenes. ' +
          'Incluye: nombre, puntuación /10, lo mejor y lo peor. Máximo 5 líneas, en español.'
        );
        const embed = new EmbedBuilder()
          .setTitle('📝 Reseña Sin Spoilers')
          .setDescription(respuesta)
          .setColor('#2ECC71')
          .setTimestamp();
        return interaction.editReply({ embeds: [embed] });
      } catch {
        return interaction.editReply('Me quedé en blanco, intenta de nuevo.');
      }
    }


    // ═══════════════════════════════════════════════════════════════
    // 🛒 TIENDA
    // ═══════════════════════════════════════════════════════════════

    case 'tienda': {
      const { embed, components } = buildShopEmbed();
      return interaction.reply({ embeds: [embed], components });
    }

    case 'comprar': {
      return handleComprar(interaction);
    }

    case 'tienda-add': {
      if (!esAdmin(interaction.member)) {
        return interaction.reply({ content: '❌ Solo administradores o roles **Founder** y **Admin** pueden añadir items.', ephemeral: true });
      }
      const titulo = interaction.options.getString('titulo');
      const precio = interaction.options.getInteger('precio');
      const link = interaction.options.getString('link');

      addLibro(titulo, precio, link);
      return interaction.reply({
        content: `📖 **Libro añadido a la tienda:**\n• ${titulo}\n• 💰 ${precio} monedas\n• 🔗 ${link}`,
        ephemeral: true,
      });
    }

    // ═══════════════════════════════════════════════════════════════
    // 🎰 CASINO
    // ═══════════════════════════════════════════════════════════════

    case 'slots':     return handleSlots(interaction);
    case 'coinflip':  return handleCoinflip(interaction);
    case 'dados':     return handleDados(interaction);
    case 'ruleta':    return handleRuleta(interaction);
    case 'blackjack': return handleBlackjack(interaction);

    // ═══════════════════════════════════════════════════════════════
    // 📖 GUÍA & REGLAS
    // ═══════════════════════════════════════════════════════════════

        case 'guia': {
      const welcomeEmbed = getGuiaEmbed('inicio', interaction.client.user.displayAvatarURL());

      const select = new StringSelectMenuBuilder()
        .setCustomId('guia_menu')
        .setPlaceholder('Elige una categoría de comandos')
        .addOptions(
          new StringSelectMenuOptionBuilder()
            .setLabel('📚 Inicio')
            .setDescription('Volver a la bienvenida de la guía')
            .setValue('inicio'),
          new StringSelectMenuOptionBuilder()
            .setLabel('🧠 Memoria & IA')
            .setDescription('Frases, lore, triggers e IA')
            .setValue('memoria'),
          new StringSelectMenuOptionBuilder()
            .setLabel('💰 Economía & Banco')
            .setDescription('Monedas, trabajos, minería y banco')
            .setValue('economia'),
          new StringSelectMenuOptionBuilder()
            .setLabel('🎰 Casino & Minijuegos')
            .setDescription('Apuestas, slots, ruleta, blackjack y duelos')
            .setValue('casino'),
          new StringSelectMenuOptionBuilder()
            .setLabel('🎭 Social & Roleplay')
            .setDescription('Matrimonios, abrazos, suplex, bailes y texto plano')
            .setValue('social'),
          new StringSelectMenuOptionBuilder()
            .setLabel('📊 Niveles & Rangos')
            .setDescription('Rangos de nivel de chat y experiencia')
            .setValue('niveles')
        );

      const row = new ActionRowBuilder().addComponents(select);

      return interaction.reply({ embeds: [welcomeEmbed], components: [row] });
    }

    case 'reglas': {
      const embed = new EmbedBuilder()
        .setTitle('📜 Reglas del Servidor — Lush Family')
        .setColor('#FF6B35')
        .setThumbnail(interaction.guild.iconURL({ dynamic: true }))
        .setDescription('Para mantener la armonía en la familia, respeta las siguientes reglas:')
        .addFields(
          {
            name: '1️⃣ Respeto ante todo',
            value: 'Trata a todos con respeto. No se toleran insultos, acoso, discriminación ni toxicidad de ningún tipo.',
            inline: false,
          },
          {
            name: '2️⃣ Sin spam ni flood',
            value: 'No enviar mensajes repetitivos, cadenas de texto, emojis excesivos ni publicidad sin permiso.',
            inline: false,
          },
          {
            name: '3️⃣ Contenido apropiado',
            value: 'Prohibido el contenido NSFW, gore, o cualquier material ofensivo. Mantén las cosas aptas para todos.',
            inline: false,
          },
          {
            name: '4️⃣ Usa los canales correctos',
            value: 'Cada canal tiene su propósito. Memes en memes, música en música, casino en casino. Respeta el orden.',
            inline: false,
          },
          {
            name: '5️⃣ No pedir roles ni permisos',
            value: 'Los roles se ganan con actividad y confianza. No insistas pidiendo moderador o roles especiales.',
            inline: false,
          },
          {
            name: '6️⃣ Sin trampas en la economía',
            value: 'No explotar bugs del bot, hacer cuentas alt para farmear monedas, ni hacer tratos injustos.',
            inline: false,
          },
          {
            name: '7️⃣ Privacidad',
            value: 'No compartir información personal de otros miembros sin su consentimiento.',
            inline: false,
          },
          {
            name: '8️⃣ Decisiones del staff son finales',
            value: 'Si un moderador o admin toma una decisión, respétala. Puedes apelar por DM, no en público.',
            inline: false,
          },
        )
        .setFooter({ text: '⚠️ Romper las reglas = warn → mute → ban • ¡Diviértete con responsabilidad!' })
        .setTimestamp();

      return interaction.reply({ embeds: [embed] });
    }

    // ═══════════════════════════════════════════════════════════════
    // 🎮 MINIJUEGOS
    // ═══════════════════════════════════════════════════════════════

    case 'ppt':     return handlePPT(interaction);
    case '8ball':   return handle8Ball(interaction);
    case 'adivina': return handleAdivina(interaction);
    case 'ship':    return handleShip(interaction);
    case 'duelo':   return handleDuelo(interaction);

    // ═══════════════════════════════════════════════════════════════
    // 📢 ANUNCIOS Y CONFIG (ADMIN)
    // ═══════════════════════════════════════════════════════════════

    case 'forzar-onboarding': {
      if (!esAdmin(interaction.member)) {
        return interaction.reply({ content: '❌ Solo administradores o roles **Founder** y **Admin** pueden ejecutar este comando.', ephemeral: true });
      }
      await interaction.deferReply({ ephemeral: true });

      try {
        const guild = interaction.guild;
        await guild.members.fetch(); // Cargar todos los miembros

        // Buscar o crear rol "No Verificado"
        let rolNoVerif = guild.roles.cache.find(r =>
          r.name.toLowerCase().includes('no verificado') || r.name.toLowerCase().includes('visitante')
        );
        if (!rolNoVerif) {
          rolNoVerif = await guild.roles.create({ name: 'No Verificado', color: '#95A5A6', reason: 'Forzar onboarding' });
        }

        // Buscar rol "Miembro" (o similares)
        const rolMiembro = guild.roles.cache.find(r =>
          r.name.toLowerCase() === 'miembro' ||
          r.name.toLowerCase().includes('miembro') ||
          r.name.toLowerCase().includes('registrado') ||
          r.name.toLowerCase().includes('novato')
        );

        let procesados = 0;
        let errores = 0;

        for (const [, member] of guild.members.cache) {
          if (member.user.bot) continue;

          // Si ya tiene rol Miembro o superior, saltar
          const yaMiembro = rolMiembro && member.roles.cache.has(rolMiembro.id);
          if (yaMiembro) continue;

          try {
            // Asignar "No Verificado" si no lo tiene
            if (!member.roles.cache.has(rolNoVerif.id)) {
              await member.roles.add(rolNoVerif);
            }

            // Enviar DM indicando qué debe hacer
            await member.send({
              embeds: [
                new EmbedBuilder()
                  .setTitle('🎮 ¡Necesitas verificarte en Lush Family!')
                  .setColor('#E67E22')
                  .setDescription(
                    `Hola **${member.user.username}**,\n\n` +
                    `El servidor requiere que todos los miembros completen su registro.\n\n` +
                    `**¿Qué debes hacer?**\n` +
                    `> Ve a cualquier canal visible y usa el comando:\n` +
                    `> 📌 \`/vincular\`\n\n` +
                    `Se abrirá una ventana donde deberás escribir tu **nick de Audition** y una breve **presentación**.\n\n` +
                    `Al completarlo, recibirás automáticamente el rol de **Miembro** y acceso completo al servidor. 🐟`
                  )
                  .setFooter({ text: 'Lush Family • Audition Latino' })
              ]
            }).catch(() => null); // Si tiene DMs cerrados, ignorar

            procesados++;
          } catch {
            errores++;
          }
        }

        return interaction.editReply(
          `✅ Onboarding forzado completado.\n` +
          `• **${procesados}** miembros notificados y marcados como No Verificado.\n` +
          `• **${errores}** errores (puede ser por permisos o roles superiores).\n\n` +
          `Todos verán solo la categoría INICIO hasta que usen \`/vincular\`.`
        );
      } catch (err) {
        console.error('[ForzarOnboarding] Error:', err);
        return interaction.editReply('❌ Error al procesar. Asegúrate de que el bot tenga permisos de Gestionar Roles.');
      }
    }

    case 'setup-canales': {
      // Restringir a los roles "Founder" y "Admin" (o administradores)
      if (!esAdmin(interaction.member)) {
        return interaction.reply({ content: '❌ Solo los roles **Founder** o **Admin** pueden ejecutar este comando.', ephemeral: true });
      }
      
      await interaction.deferReply({ ephemeral: true });
      const guild = interaction.guild;
      
      try {
        const structure = [
          {
            name: '📢 | INFORMACIÓN',
            channels: [
              { name: '👋-bienvenida', type: 0 },
              { name: '👋-presentaciones', type: 0 },
              { name: '📜-reglas', type: 0 },
              { name: '📣-anuncios', type: 0 },
              { name: '🎭-roles', type: 0 },
              { name: '🎉-eventos', type: 0 }
            ]
          },
          {
            name: '💬 | COMUNIDAD',
            channels: [
              { name: '💭-general', type: 0 },
              { name: '😂-memes', type: 0 },
              { name: '🎵-música', type: 0 },
              { name: '📷-clips-y-fotos', type: 0 },
              { name: '🤫-confesiones', type: 0 }
            ]
          },
          {
            name: '🎶 | AUDITION',
            channels: [
              { name: 'audition-general', type: 0 },
              { name: 'buscar-duo', type: 0 }
            ]
          },
          {
            name: '🕹️ | MULTIJUEGO',
            channels: [
              { name: '🕹️-minijuegos', type: 0 },
              { name: '🎰-casino', type: 0 }
            ]
          },
          {
            name: '💰 | ECONOMÍA',
            channels: [
              { name: '💰-economía', type: 0 },
              { name: '🛒-tienda', type: 0 },
              { name: '🏦-banco', type: 0 }
            ]
          },
          {
            name: '🎙️ | VOZ',
            channels: [
              { name: 'General', type: 2 },
              { name: 'Gaming', type: 2 },
              { name: 'Música', type: 2 }
            ]
          }
        ];

        for (const cat of structure) {
          const category = await guild.channels.create({
            name: cat.name,
            type: 4 // Tipo 4 = Categoría
          });
          
          for (const ch of cat.channels) {
            await guild.channels.create({
              name: ch.name,
              type: ch.type, // 0 = Texto, 2 = Voz
              parent: category.id
            });
          }
        }
        
        return interaction.editReply('✅ Toda la estructura de categorías y canales fue creada exitosamente.');
      } catch (err) {
        console.error(err);
        return interaction.editReply('❌ Hubo un error al crear los canales. Asegúrate de que el bot tenga el permiso "Gestionar canales".');
      }
    }

    case 'setup-mensajes': {
      if (!esAdmin(interaction.member)) {
        return interaction.reply({ content: '❌ Solo administradores o roles **Founder** y **Admin** pueden ejecutar este comando.', ephemeral: true });
      }
      await interaction.deferReply({ ephemeral: true });

      const { getAnuncio } = await import('../announcements.js');
      const guild = interaction.guild;
      
      const mapping = {
        'bienvenid': 'principal',
        'regla': 'reglas',
        'autorol': 'roles',
        'guia': 'guias',
        'redes': 'redes',
        'presentacion': 'presentacion',
        'meme': 'memes',
        'confesion': 'confesiones',
        'banco': 'banco',
        'economia': 'economia',
        'minijuego': 'minijuegos',
        'casino': 'casino',
        'libro': 'libros',
        'sala-gamer': 'offtopic',
        'captura': 'capturas',
        'grabacion': 'capturas',
        'screenshot': 'capturas'
      };

      let count = 0;

      for (const [id, channel] of guild.channels.cache) {
        if (channel.type !== 0) continue; // Solo canales de texto
        
        const cName = channel.name.toLowerCase();
        
        for (const [key, tipo] of Object.entries(mapping)) {
          if (cName.includes(key)) {
            const embed = getAnuncio(tipo);
            if (embed) {
              await channel.send({ embeds: [embed] }).catch(() => null);
              count++;
              break; // Solo enviar un mensaje por canal (el primero que coincida)
            }
          }
        }
      }

      return interaction.editReply(`✅ Mensajes configurados exitosamente en ${count} canales.`);
    }

    case 'setup-verificacion': {
      if (!esAdmin(interaction.member)) {
        return interaction.reply({ content: '❌ Solo administradores o roles **Founder** y **Admin** pueden ejecutar este comando.', ephemeral: true });
      }
      await interaction.deferReply({ ephemeral: true });
      
      try {
        const guild = interaction.guild;
        
        let unverifiedRole = guild.roles.cache.find(r => r.name.toLowerCase().includes('no verificado') || r.name.toLowerCase().includes('visitante'));
        if (!unverifiedRole) {
           unverifiedRole = await guild.roles.create({ name: 'No Verificado', color: '#95A5A6', reason: 'Setup de verificación' });
        }

        const categories = guild.channels.cache.filter(c => c.type === 4); // Category channels
        
        for (const [id, category] of categories) {
          if (category.name.toLowerCase().includes('inicio') || category.name.toLowerCase().includes('welcome') || category.name.toLowerCase().includes('bienvenid')) {
            // Permitir ver a No Verificado
            await category.permissionOverwrites.edit(unverifiedRole.id, { ViewChannel: true });
            await category.permissionOverwrites.edit(guild.roles.everyone.id, { ViewChannel: true });
          } else {
            // Denegar a No Verificado
            await category.permissionOverwrites.edit(unverifiedRole.id, { ViewChannel: false });
          }
        }
        
        return interaction.editReply('✅ Sistema de verificación configurado. Los nuevos usuarios recibirán el rol "No Verificado" al entrar y no podrán ver los canales (excepto la categoría de INICIO) hasta usar `/vincular`.');
      } catch (err) {
        console.error(err);
        return interaction.editReply('❌ Hubo un error al configurar los permisos. Asegúrate de que mi rol tenga permisos de Administrador.');
      }
    }

    case 'anuncio': {
      if (!esAdmin(interaction.member)) {
        return interaction.reply({ content: '❌ Solo administradores o roles **Founder** y **Admin** pueden ejecutar este comando.', ephemeral: true });
      }
      const tipo = interaction.options.getString('tipo');
      const canalObjetivo = interaction.options.getChannel('canal') || interaction.channel;

      const embed = getAnuncio(tipo);
      if (!embed) return interaction.reply({ content: '❌ Tipo no encontrado.', ephemeral: true });
      
      try {
        await canalObjetivo.send({ embeds: [embed] });
        return interaction.reply({ content: `✅ Anuncio publicado en <#${canalObjetivo.id}>.`, ephemeral: true });
      } catch (err) {
        return interaction.reply({ content: '❌ No tengo permisos para escribir en ese canal.', ephemeral: true });
      }
    }

    // ═══════════════════════════════════════════════════════════════
    // 🏦 BANCO
    // ═══════════════════════════════════════════════════════════════

    case 'saldo':       return handleSaldo(interaction);
    case 'depositar':   return handleDepositar(interaction);
    case 'retirar':     return handleRetirar(interaction);
    case 'transferir':  return handleTransferir(interaction);
    case 'robar':       return handleRobar(interaction);

    // Matrimonios y Roleplay
    case 'casarse':     return handleCasarse(interaction);
    case 'divorciarse': return handleDivorciarse(interaction);
    case 'pareja':      return handlePareja(interaction);
    case 'abrazar':
    case 'besar':
    case 'patear':
    case 'bofetada':
    case 'acariciar':
    case 'morder':
    case 'matar':
    case 'bailar':
    case 'suplex':
    case 'punete':
    case 'esquivar':
    case 'esconderse':
      return handleRoleplayCommand(interaction);

    case 'llamame': {
      const nombre = interaction.options.getString('nombre').trim();
      db_nombres.guardar(interaction.user.id, nombre);
      return interaction.reply({
        content: `🗣️ ¡Entendido! A partir de ahora te llamaré **${nombre}**.`,
        ephemeral: true
      });
    }

    case 'recuerdame': {
      const dato = interaction.options.getString('dato').trim();
      db_memorias.guardar(interaction.user.id, dato);
      return interaction.reply({
        content: `🧠 ¡Guardado en mi memoria! Recordaré que: *"${dato}"*.`,
        ephemeral: true
      });
    }

    case 'mis-recuerdos': {
      const prefName = db_nombres.obtener(interaction.user.id);
      const recuerdos = db_memorias.obtenerTodas(interaction.user.id);

      const embed = new EmbedBuilder()
        .setTitle(`🧠 Memoria de ${interaction.user.username}`)
        .setColor('#9B59B6')
        .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
        .setTimestamp();

      let desc = '';
      if (prefName) {
        desc += `🗣️ **Nombre preferido:** ${prefName}\n\n`;
      } else {
        desc += `🗣️ **Nombre preferido:** *Ninguno (uso tu nombre de Discord)*\n\n`;
      }

      if (recuerdos.length > 0) {
        desc += `**Recuerdos guardados:**\n` + recuerdos.map((r, i) => `• ${r.contenido}`).join('\n');
      } else {
        desc += `**Recuerdos guardados:** *No tengo ningún recuerdo guardado sobre ti todavía. ¡Usa \`/recuerdame\` para agregar uno!*`;
      }

      embed.setDescription(desc);
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    case 'olvidame': {
      // Borrar de nombres
      try {
        db.prepare(`DELETE FROM nombres WHERE user_id = ?`).run(interaction.user.id);
      } catch (e) {
        db_nombres.guardar(interaction.user.id, '');
      }
      db_memorias.eliminarTodas(interaction.user.id);
      return interaction.reply({
        content: `🧹 He borrado tu nombre preferido y todos tus recuerdos de mi memoria. ¡Empezamos de cero!`,
        ephemeral: true
      });
    }

    case 'aprender': {
      const hecho = interaction.options.getString('hecho').trim();
      db_lore.guardar(hecho, interaction.user.username);
      return interaction.reply({
        content: `🧠 ¡Entendido! He aprendido este hecho general sobre la familia: *"${hecho}"*. Lo tendré en cuenta en mis conversaciones.`,
        ephemeral: false
      });
    }

    case 'hechos': {
      const todoLore = db_lore.obtenerTodo(30);

      const embed = new EmbedBuilder()
        .setTitle('📖 Lore y Hechos Aprendidos')
        .setColor('#E67E22')
        .setTimestamp();

      if (todoLore.length > 0) {
        const desc = todoLore.map(l => `• **[ID: ${l.id}]** ${l.contenido} *(por ${l.autor || 'IA'})*`).join('\n');
        embed.setDescription(desc);
      } else {
        embed.setDescription('*Aún no he aprendido ningún hecho general sobre el clan/servidor. ¡Usa \`/aprender\` para enseñarme algo!*');
      }

      return interaction.reply({ embeds: [embed] });
    }

    case 'olvidar-hecho': {
      const busqueda = interaction.options.getString('busqueda').trim().toLowerCase();
      const rows = db.prepare(`SELECT * FROM lore WHERE contenido LIKE ? LIMIT 5`).all(`%${busqueda}%`);
      
      if (rows.length === 0) {
        return interaction.reply({ content: `❌ No encontré ningún hecho que coincida con "${busqueda}".`, ephemeral: true });
      }

      if (rows.length > 1) {
        const lista = rows.map(r => `• **[ID: ${r.id}]** ${r.contenido}`).join('\n');
        return interaction.reply({
          content: `⚠️ Encontré más de una coincidencia. Por favor, sé más específico o borra directamente el hecho:\n${lista}`,
          ephemeral: true
        });
      }

      const hechoABorrar = rows[0];
      db.prepare(`DELETE FROM lore WHERE id = ?`).run(hechoABorrar.id);

      return interaction.reply({
        content: `🧹 He borrado de mi memoria este hecho: *"${hechoABorrar.contenido}"*`,
        ephemeral: false
      });
    }

    default:
      return interaction.reply({ content: 'Comando no reconocido.', ephemeral: true });
  }
}