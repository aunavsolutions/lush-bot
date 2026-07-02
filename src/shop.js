// src/shop.js
// Sistema de tienda — Lush Family
// Los miembros gastan sus monedas aquí

import { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { db_economia } from './memory/database.js';
import db from './memory/database.js';

// ─── TABLAS ─────────────────────────────────────────────────────────────

db.exec(`
  -- Compras realizadas
  CREATE TABLE IF NOT EXISTS compras (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id   TEXT NOT NULL,
    item_id   TEXT NOT NULL,
    fecha     INTEGER DEFAULT (unixepoch())
  );

  -- Títulos comprados (activos por usuario)
  CREATE TABLE IF NOT EXISTS titulos_custom (
    user_id   TEXT PRIMARY KEY,
    titulo    TEXT NOT NULL
  );

  -- XP Boost activo
  CREATE TABLE IF NOT EXISTS xp_boosts (
    user_id   TEXT PRIMARY KEY,
    multiplier REAL DEFAULT 2.0,
    expira_en  INTEGER NOT NULL
  );
`);

// ─── CATÁLOGO ───────────────────────────────────────────────────────────

const CATALOGO = {
  roles: {
    emoji: '🎨',
    nombre: 'Roles de Color',
    descripcion: 'Personaliza tu nombre en el server',
    items: [
      { id: 'role_rojo',      nombre: '🔴 Rojo Fuego',       precio: 500,  color: '#FF3B3B' },
      { id: 'role_azul',      nombre: '🔵 Azul Eléctrico',   precio: 500,  color: '#3B82F6' },
      { id: 'role_verde',     nombre: '🟢 Verde Neón',       precio: 500,  color: '#22C55E' },
      { id: 'role_morado',    nombre: '🟣 Morado Real',      precio: 500,  color: '#A855F7' },
      { id: 'role_rosa',      nombre: '🩷 Rosa Sakura',      precio: 500,  color: '#EC4899' },
      { id: 'role_dorado',    nombre: '🟡 Dorado VIP',       precio: 2000, color: '#FFD700' },
      { id: 'role_arcoiris',  nombre: '🌈 Arcoíris',         precio: 5000, color: '#FF6B6B' },
    ],
  },
  titulos: {
    emoji: '🏷️',
    nombre: 'Títulos Exclusivos',
    descripcion: 'Títulos que reemplazan tu rango en /perfil',
    items: [
      { id: 'titulo_leyenda',   nombre: '👑 Leyenda Lush',    precio: 3000 },
      { id: 'titulo_og',        nombre: '🏆 OG de la Familia',   precio: 2000 },
      { id: 'titulo_shadow',    nombre: '🌑 Shadow Dancer',      precio: 1500 },
      { id: 'titulo_neon',      nombre: '💜 Neon Vibes',          precio: 1500 },
      { id: 'titulo_tryhard',   nombre: '🔥 Tryhard Supremo',    precio: 1000 },
      { id: 'titulo_chill',     nombre: '🧊 Chill Master',       precio: 1000 },
    ],
  },
  boosts: {
    emoji: '⚡',
    nombre: 'Power-Ups',
    descripcion: 'Mejoras temporales',
    items: [
      { id: 'xp_boost_1h',   nombre: '⚡ XP x2 (1 hora)',      precio: 300,  duracion: 3600 },
      { id: 'xp_boost_6h',   nombre: '⚡ XP x2 (6 horas)',     precio: 1500, duracion: 21600 },
      { id: 'xp_boost_24h',  nombre: '⚡ XP x2 (24 horas)',    precio: 5000, duracion: 86400 },
      { id: 'loteria',       nombre: '🎰 Ticket de Lotería',    precio: 100 },
    ],
  },
  libros: {
    emoji: '📖',
    nombre: 'Biblioteca Lush',
    descripcion: 'PDFs y recursos exclusivos',
    items: [
      // Los admins añaden libros con /tienda-add
    ],
  },
};

// ─── HELPERS ────────────────────────────────────────────────────────────

function findItem(itemId) {
  for (const cat of Object.values(CATALOGO)) {
    const item = cat.items.find(i => i.id === itemId);
    if (item) return item;
  }
  return null;
}

function hasBought(userId, itemId) {
  return db.prepare('SELECT id FROM compras WHERE user_id = ? AND item_id = ?').get(userId, itemId);
}

function registerPurchase(userId, itemId) {
  db.prepare('INSERT INTO compras (user_id, item_id) VALUES (?, ?)').run(userId, itemId);
}

// Libros dinámicos (añadidos por admins)
function getLibros() {
  try {
    const rows = db.prepare("SELECT * FROM tienda_libros").all();
    return rows.map(r => ({
      id: `libro_${r.id}`,
      nombre: `📖 ${r.titulo}`,
      precio: r.precio,
      link: r.link,
      dbId: r.id,
    }));
  } catch {
    return [];
  }
}

// ─── COMANDO /tienda ────────────────────────────────────────────────────

export function buildShopEmbed(category = null) {
  // Añadir libros dinámicos
  CATALOGO.libros.items = getLibros();

  if (!category) {
    // Menú principal
    const embed = new EmbedBuilder()
      .setTitle('🛒 Tienda Lush')
      .setDescription('Gasta tus monedas en items exclusivos.\nUsa el menú para explorar categorías.')
      .setColor('#FF6B35')
      .setTimestamp();

    for (const [key, cat] of Object.entries(CATALOGO)) {
      const count = cat.items.length;
      embed.addFields({
        name: `${cat.emoji} ${cat.nombre}`,
        value: `${cat.descripcion}\n*${count} item${count !== 1 ? 's' : ''}*`,
        inline: true,
      });
    }

    const menu = new StringSelectMenuBuilder()
      .setCustomId('shop_category')
      .setPlaceholder('Selecciona una categoría')
      .addOptions(
        Object.entries(CATALOGO).map(([key, cat]) => ({
          label: cat.nombre,
          value: key,
          emoji: cat.emoji,
          description: `${cat.items.length} items disponibles`,
        }))
      );

    const row = new ActionRowBuilder().addComponents(menu);
    return { embed, components: [row] };
  }

  // Categoría específica
  const cat = CATALOGO[category];
  if (!cat) return null;

  const embed = new EmbedBuilder()
    .setTitle(`${cat.emoji} ${cat.nombre}`)
    .setDescription(cat.descripcion)
    .setColor('#FF6B35')
    .setTimestamp();

  if (cat.items.length === 0) {
    embed.addFields({ name: 'Vacío', value: 'No hay items en esta categoría aún.' });
  } else {
    for (const item of cat.items) {
      embed.addFields({
        name: `${item.nombre}`,
        value: `💰 **${item.precio}** monedas\n\`/comprar ${item.id}\``,
        inline: true,
      });
    }
  }

  // Botón de volver
  const backBtn = new ButtonBuilder()
    .setCustomId('shop_back')
    .setLabel('← Volver')
    .setStyle(ButtonStyle.Secondary);

  const row = new ActionRowBuilder().addComponents(backBtn);
  return { embed, components: [row] };
}

// ─── COMANDO /comprar ───────────────────────────────────────────────────

export async function handleComprar(interaction) {
  const itemId = interaction.options.getString('item');
  const userId = interaction.user.id;

  const item = findItem(itemId);
  if (!item) {
    return interaction.reply({ content: '❌ Item no encontrado. Revisa `/tienda` para ver los items disponibles.', ephemeral: true });
  }

  // Verificar monedas
  const perfil = db_economia.obtener(userId);
  if (perfil.monedas < item.precio) {
    return interaction.reply({
      content: `❌ No tienes suficientes monedas.\n💰 Tienes: **${perfil.monedas}** — Necesitas: **${item.precio}**`,
      ephemeral: true,
    });
  }

  // ── Procesar según tipo de item ──

  // ROLES DE COLOR
  if (itemId.startsWith('role_')) {
    if (hasBought(userId, itemId)) {
      return interaction.reply({ content: '❌ Ya tienes este rol.', ephemeral: true });
    }

    const roleName = item.nombre.replace(/^.{2} /, ''); // quitar emoji
    let role = interaction.guild.roles.cache.find(r => r.name === roleName);

    if (!role) {
      try {
        role = await interaction.guild.roles.create({
          name: roleName,
          color: item.color,
          reason: `Rol de tienda comprado por ${interaction.user.username}`,
        });
      } catch (err) {
        return interaction.reply({ content: '❌ No pude crear el rol. Verifica permisos del bot.', ephemeral: true });
      }
    }

    try {
      await interaction.member.roles.add(role);
    } catch {
      return interaction.reply({ content: '❌ No pude asignarte el rol. Verifica la jerarquía de roles.', ephemeral: true });
    }

    db_economia.agregarMonedas(userId, -item.precio);
    registerPurchase(userId, itemId);

    return interaction.reply({
      embeds: [new EmbedBuilder()
        .setTitle('✅ ¡Rol Comprado!')
        .setDescription(`${item.nombre}\nYa tienes tu nuevo color. 🎨`)
        .setColor(item.color)
        .setFooter({ text: `💰 -${item.precio} monedas | Saldo: ${perfil.monedas - item.precio}` })
      ],
    });
  }

  // TÍTULOS
  if (itemId.startsWith('titulo_')) {
    if (hasBought(userId, itemId)) {
      return interaction.reply({ content: '❌ Ya tienes este título.', ephemeral: true });
    }

    const tituloText = item.nombre.replace(/^.{2} /, '');
    db.prepare('INSERT OR REPLACE INTO titulos_custom (user_id, titulo) VALUES (?, ?)').run(userId, tituloText);
    db_economia.agregarMonedas(userId, -item.precio);
    registerPurchase(userId, itemId);

    return interaction.reply({
      embeds: [new EmbedBuilder()
        .setTitle('✅ ¡Título Equipado!')
        .setDescription(`Tu nuevo título: **${tituloText}**\nAparece en tu \`/perfil\`.`)
        .setColor('#A855F7')
        .setFooter({ text: `💰 -${item.precio} monedas | Saldo: ${perfil.monedas - item.precio}` })
      ],
    });
  }

  // XP BOOST
  if (itemId.startsWith('xp_boost_')) {
    const ahora = Math.floor(Date.now() / 1000);
    const boostActivo = db.prepare('SELECT * FROM xp_boosts WHERE user_id = ? AND expira_en > ?').get(userId, ahora);
    if (boostActivo) {
      const restante = boostActivo.expira_en - ahora;
      const min = Math.floor(restante / 60);
      return interaction.reply({ content: `❌ Ya tienes un XP Boost activo (${min} min restantes).`, ephemeral: true });
    }

    db_economia.agregarMonedas(userId, -item.precio);
    registerPurchase(userId, itemId);
    db.prepare('INSERT OR REPLACE INTO xp_boosts (user_id, multiplier, expira_en) VALUES (?, 2.0, ?)').run(userId, ahora + item.duracion);

    const horas = Math.floor(item.duracion / 3600);
    return interaction.reply({
      embeds: [new EmbedBuilder()
        .setTitle('⚡ ¡XP Boost Activado!')
        .setDescription(`**x2 XP** por las próximas **${horas} hora${horas > 1 ? 's' : ''}**.\nToda la XP que ganes se duplica.`)
        .setColor('#FBBF24')
        .setFooter({ text: `💰 -${item.precio} monedas | Saldo: ${perfil.monedas - item.precio}` })
      ],
    });
  }

  // LOTERÍA
  if (itemId === 'loteria') {
    db_economia.agregarMonedas(userId, -item.precio);
    registerPurchase(userId, itemId);

    const roll = Math.random() * 100;
    let premio = 0;
    let msg = '';

    if (roll < 1) {        // 1% — JACKPOT
      premio = 10000;
      msg = '🎰🎰🎰 **¡¡¡JACKPOT!!!** 🎰🎰🎰\n¡Ganaste **10,000 monedas**! 🤑🤑🤑';
    } else if (roll < 5) { // 4% — Gran premio
      premio = 2000;
      msg = '🎰 **¡GRAN PREMIO!** Ganaste **2,000 monedas** 🎉';
    } else if (roll < 15) { // 10% — Premio medio
      premio = 500;
      msg = '🎰 **¡Buen tiro!** Ganaste **500 monedas** 😎';
    } else if (roll < 35) { // 20% — Recuperas lo invertido
      premio = 100;
      msg = '🎰 Recuperaste tu inversión: **100 monedas** 😐';
    } else {                // 65% — Pierdes
      msg = '🎰 No tuviste suerte esta vez... 😔\nIntenta de nuevo con `/comprar loteria`';
    }

    if (premio > 0) db_economia.agregarMonedas(userId, premio);

    return interaction.reply({
      embeds: [new EmbedBuilder()
        .setTitle('🎰 Lotería Lush')
        .setDescription(msg)
        .setColor(premio >= 2000 ? '#FFD700' : premio > 0 ? '#22C55E' : '#EF4444')
        .setFooter({ text: `💰 Saldo: ${perfil.monedas - item.precio + premio} monedas` })
      ],
    });
  }

  // LIBROS
  if (itemId.startsWith('libro_')) {
    if (hasBought(userId, itemId)) {
      // Ya comprado — reenviar link
      return interaction.reply({ content: `📖 Ya compraste este libro. Aquí está tu link: ${item.link}`, ephemeral: true });
    }

    db_economia.agregarMonedas(userId, -item.precio);
    registerPurchase(userId, itemId);

    return interaction.reply({
      content: `📖 **¡Libro Comprado!**\nAquí está tu link de descarga:\n${item.link}`,
      ephemeral: true, // solo visible para el comprador
    });
  }

  return interaction.reply({ content: '❌ Item no reconocido.', ephemeral: true });
}

// ─── XP BOOST CHECK ─────────────────────────────────────────────────────

export function getXpMultiplier(userId) {
  const ahora = Math.floor(Date.now() / 1000);
  const boost = db.prepare('SELECT multiplier FROM xp_boosts WHERE user_id = ? AND expira_en > ?').get(userId, ahora);
  return boost ? boost.multiplier : 1.0;
}

// ─── TÍTULO CUSTOM ──────────────────────────────────────────────────────

export function getTituloCustom(userId) {
  const row = db.prepare('SELECT titulo FROM titulos_custom WHERE user_id = ?').get(userId);
  return row?.titulo || null;
}

// ─── ADMIN: AÑADIR LIBRO ────────────────────────────────────────────────

export function addLibro(titulo, precio, link) {
  db.exec(`CREATE TABLE IF NOT EXISTS tienda_libros (
    id     INTEGER PRIMARY KEY AUTOINCREMENT,
    titulo TEXT NOT NULL,
    precio INTEGER NOT NULL,
    link   TEXT NOT NULL
  )`);
  db.prepare('INSERT INTO tienda_libros (titulo, precio, link) VALUES (?, ?, ?)').run(titulo, precio, link);
}
