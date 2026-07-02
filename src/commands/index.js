// src/commands/index.js
// Comandos slash del bot — Lush Family

import { SlashCommandBuilder, EmbedBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } from 'discord.js';
import { db_frases, db_lore, db_triggers, db_config, db_economia, db_cooldowns } from '../memory/database.js';
import { responderMensaje, consultarGemini } from '../memory/brain.js';

import { handleJob, handleVender } from '../jobs.js';
import { buildShopEmbed, handleComprar, addLibro } from '../shop.js';
import { handleSlots, handleCoinflip, handleDados, handleRuleta, handleBlackjack } from '../casino.js';
import { handlePPT, handle8Ball, handleAdivina, handleShip, handleDuelo } from '../minigames.js';
import { getAnuncio } from '../announcements.js';
import { handleSaldo, handleDepositar, handleRetirar, handleTransferir, handleRobar } from '../bank.js';
import { calcularNivel, obtenerTitulo, xpParaNivel, embedPerfil } from '../levels.js';
import db from '../memory/database.js';

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
];

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

      return interaction.reply({
        content: `❌ Este comando solo funciona en ${sugerencia}.`,
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
      // Solo admins
      if (!interaction.member.permissions.has('Administrator')) {
        return interaction.reply({ content: '❌ Solo los administradores pueden añadir items.', ephemeral: true });
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
      const embeds = [
        new EmbedBuilder()
          .setTitle('🐟 Lush Bot — Guía de Comandos')
          .setDescription('Todo lo que necesitas saber para disfrutar del bot.')
          .setColor('#FF6B35')
          .setThumbnail(interaction.client.user.displayAvatarURL())
          .setTimestamp(),

        new EmbedBuilder()
          .setTitle('🧠 Familia & Memoria')
          .setColor('#9B59B6')
          .addFields(
            { name: '/recuerdo', value: 'Saco algo random de la familia', inline: true },
            { name: '/frase <texto>', value: 'Guarda una frase legendaria', inline: true },
            { name: '/lore <historia>', value: 'Guarda un momento épico', inline: true },
            { name: '/trigger <palabra>', value: 'Agrego una palabra que me activa', inline: true },
            { name: '/gemini <pregunta>', value: 'Pregúntale a la IA', inline: true },
            { name: '\u200b', value: '\u200b', inline: true },
          ),

        new EmbedBuilder()
          .setTitle('💼 Economía & Trabajos')
          .setColor('#F59E0B')
          .addFields(
            { name: '/perfil', value: 'Tu nivel, XP y monedas', inline: true },
            { name: '/minar', value: '⛏️ Piedra • Hierro • Oro • 💎', inline: true },
            { name: '/pescar', value: '🎣 Pez • Globo • Dorado • 🦑', inline: true },
            { name: '/farmear', value: '🌾 Trigo • Zanahoria • Sandía • ⭐', inline: true },
            { name: '/vender', value: 'Vende todos tus recursos', inline: true },
            { name: '/trabajo', value: 'Trabaja cada 30 min', inline: true },
          )
          .setFooter({ text: '⏳ Cooldown: 5 min entre recolecciones • 💎 Items raros valen 1,000💰' }),

        new EmbedBuilder()
          .setTitle('🛒 Tienda Lush')
          .setColor('#22C55E')
          .addFields(
            { name: '/tienda', value: 'Explora categorías con menú interactivo', inline: false },
            { name: '/comprar <item>', value: 'Compra un item de la tienda', inline: false },
            { name: '🎨 Roles de Color', value: 'Desde 500💰 • Dorado 2,000💰 • Arcoíris 5,000💰', inline: false },
            { name: '🏷️ Títulos', value: 'Leyenda 3,000💰 • OG 2,000💰 • Shadow 1,500💰', inline: true },
            { name: '⚡ Power-Ups', value: 'XP x2 desde 300💰 • 🎰 Lotería 100💰', inline: true },
          ),

        new EmbedBuilder()
          .setTitle('🎰 Casino Lush')
          .setColor('#EF4444')
          .addFields(
            { name: '/slots <apuesta>', value: '🎰 Tragamonedas — Triple 7️⃣ = x10 Jackpot!', inline: true },
            { name: '/coinflip <apuesta>', value: '🪙 Cara o Cruz — 50/50', inline: true },
            { name: '/dados <apuesta>', value: '🎲 Dados vs Bot — mayor suma gana', inline: true },
            { name: '/ruleta <apuesta> <color>', value: '🔴 Rojo/Negro x2 • 🟢 Verde x14', inline: true },
            { name: '/blackjack <apuesta>', value: '🃏 Interactivo con botones • Natural x2.5', inline: true },
            { name: '\u200b', value: '\u200b', inline: true },
          )
          .setFooter({ text: '💰 Apuesta mín: 10 • máx: 50,000 • ¡Juega responsablemente!' }),

        new EmbedBuilder()
          .setTitle('📊 Niveles & Rangos')
          .setColor('#8B5CF6')
          .setDescription(
            'Gana XP al chatear y usar comandos. \u00a1Sube de nivel autom\u00e1ticamente!\n\n' +
            '```\n' +
            'Lv.1  \u2192 Novato del Beat\n' +
            'Lv.5  \u2192 Bailar\u00edn Casual\n' +
            'Lv.10 \u2192 Combo Breaker\n' +
            'Lv.15 \u2192 Freestyler\n' +
            'Lv.20 \u2192 M\u00e1quina de BPM\n' +
            'Lv.25 \u2192 Leyenda del Dance Floor\n' +
            'Lv.30 \u2192 \u00cdcono Lush\n' +
            '```'
          )
          .setFooter({ text: '🐟 Lush Family — Audition Latino • ¡Diviértanse, familia! 🎮' }),
      ];

      return interaction.reply({ embeds });
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
      if (!interaction.member.permissions.has('Administrator')) {
        return interaction.reply({ content: '❌ Solo administradores.', ephemeral: true });
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

    case 'setup-mensajes': {
      if (!interaction.member.permissions.has('Administrator')) {
        return interaction.reply({ content: '❌ Solo administradores.', ephemeral: true });
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
      if (!interaction.member.permissions.has('Administrator')) {
        return interaction.reply({ content: '❌ Solo administradores.', ephemeral: true });
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
      if (!interaction.member.permissions.has('Administrator')) {
        return interaction.reply({ content: '❌ Solo administradores.', ephemeral: true });
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

    default:
      return interaction.reply({ content: 'Comando no reconocido.', ephemeral: true });
  }
}