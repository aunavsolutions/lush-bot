// src/casino.js
// Mini-juegos de casino — Lush Family
// Todos usan monedas de la economía del bot

import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { db_economia } from './memory/database.js';

// ─── HELPERS ────────────────────────────────────────────────────────────

function verificarApuesta(userId, apuesta) {
  if (apuesta < 10) return '❌ La apuesta mínima es **10 monedas**.';
  if (apuesta > 50000) return '❌ La apuesta máxima es **50,000 monedas**.';
  const perfil = db_economia.obtener(userId);
  if (perfil.monedas < apuesta) return `❌ No tienes suficientes monedas. Tienes **${perfil.monedas}** 💰`;
  return null;
}

function saldo(userId) {
  return db_economia.obtener(userId).monedas;
}

// ═════════════════════════════════════════════════════════════════════════
// 🎰 SLOTS — Máquina tragamonedas
// ═════════════════════════════════════════════════════════════════════════

const SLOT_SYMBOLS = ['🍒', '🍋', '🍊', '🍇', '💎', '7️⃣', '🐟'];
const SLOT_PAYOUTS = {
  '7️⃣': 10,   // 3x 7 = 10x apuesta
  '💎': 7,    // 3x diamante = 7x
  '🐟': 5,    // 3x Lush = 5x
  '🍇': 3,    // 3x uva = 3x
  '🍊': 2,    // 3x naranja = 2x
  '🍋': 1.5,  // 3x limón = 1.5x
  '🍒': 1,    // 3x cereza = 1x (recuperas)
};

export function handleSlots(interaction) {
  const apuesta = interaction.options.getInteger('apuesta');
  const userId = interaction.user.id;
  const error = verificarApuesta(userId, apuesta);
  if (error) return interaction.reply({ content: error, ephemeral: true });

  db_economia.agregarMonedas(userId, -apuesta);

  // Girar 3 carretes
  const reels = [
    SLOT_SYMBOLS[Math.floor(Math.random() * SLOT_SYMBOLS.length)],
    SLOT_SYMBOLS[Math.floor(Math.random() * SLOT_SYMBOLS.length)],
    SLOT_SYMBOLS[Math.floor(Math.random() * SLOT_SYMBOLS.length)],
  ];

  let ganancia = 0;
  let resultado = '';

  // 3 iguales
  if (reels[0] === reels[1] && reels[1] === reels[2]) {
    const multi = SLOT_PAYOUTS[reels[0]] || 1;
    ganancia = Math.floor(apuesta * multi);
    resultado = reels[0] === '7️⃣'
      ? '🎰🎰🎰 **¡¡¡JACKPOT!!!** 🎰🎰🎰'
      : `✨ **¡TRIPLE ${reels[0]}!** Multiplicador x${multi}`;
  }
  // 2 iguales
  else if (reels[0] === reels[1] || reels[1] === reels[2] || reels[0] === reels[2]) {
    ganancia = Math.floor(apuesta * 0.5);
    resultado = '😏 **Par encontrado** — Recuperas la mitad';
  }
  // Nada
  else {
    resultado = '😔 Sin suerte esta vez...';
  }

  if (ganancia > 0) db_economia.agregarMonedas(userId, ganancia);

  const embed = new EmbedBuilder()
    .setTitle('🎰 Tragamonedas')
    .setDescription(
      `╔══════════╗\n` +
      `║  ${reels[0]}  ${reels[1]}  ${reels[2]}  ║\n` +
      `╚══════════╝\n\n` +
      `${resultado}`
    )
    .addFields(
      { name: 'Apuesta', value: `${apuesta} 💰`, inline: true },
      { name: ganancia > 0 ? 'Ganancia' : 'Pérdida', value: ganancia > 0 ? `+${ganancia} 💰` : `-${apuesta} 💰`, inline: true },
      { name: 'Saldo', value: `${saldo(userId)} 💰`, inline: true },
    )
    .setColor(ganancia >= apuesta ? '#22C55E' : ganancia > 0 ? '#FBBF24' : '#EF4444')
    .setTimestamp();

  return interaction.reply({ embeds: [embed] });
}

// ═════════════════════════════════════════════════════════════════════════
// 🪙 COINFLIP — Cara o Cruz
// ═════════════════════════════════════════════════════════════════════════

export function handleCoinflip(interaction) {
  const apuesta = interaction.options.getInteger('apuesta');
  const eleccion = interaction.options.getString('lado'); // cara | cruz
  const userId = interaction.user.id;
  const error = verificarApuesta(userId, apuesta);
  if (error) return interaction.reply({ content: error, ephemeral: true });

  db_economia.agregarMonedas(userId, -apuesta);

  const resultado = Math.random() < 0.5 ? 'cara' : 'cruz';
  const gano = eleccion === resultado;

  if (gano) db_economia.agregarMonedas(userId, apuesta * 2);

  const emoji = resultado === 'cara' ? '🪙' : '💀';

  const embed = new EmbedBuilder()
    .setTitle('🪙 Coinflip')
    .setDescription(
      `La moneda gira...\n\n` +
      `${emoji} **¡${resultado.toUpperCase()}!** ${emoji}\n\n` +
      (gano
        ? `✅ **¡Ganaste ${apuesta} monedas!**`
        : `❌ **Perdiste ${apuesta} monedas.**`)
    )
    .addFields(
      { name: 'Tu elección', value: eleccion === 'cara' ? '🪙 Cara' : '💀 Cruz', inline: true },
      { name: 'Resultado', value: `${emoji} ${resultado}`, inline: true },
      { name: 'Saldo', value: `${saldo(userId)} 💰`, inline: true },
    )
    .setColor(gano ? '#22C55E' : '#EF4444')
    .setTimestamp();

  return interaction.reply({ embeds: [embed] });
}

// ═════════════════════════════════════════════════════════════════════════
// 🎲 DADOS — Tira contra el bot
// ═════════════════════════════════════════════════════════════════════════

const DICE_EMOJI = ['', '⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];

export function handleDados(interaction) {
  const apuesta = interaction.options.getInteger('apuesta');
  const userId = interaction.user.id;
  const error = verificarApuesta(userId, apuesta);
  if (error) return interaction.reply({ content: error, ephemeral: true });

  db_economia.agregarMonedas(userId, -apuesta);

  const d1 = Math.floor(Math.random() * 6) + 1;
  const d2 = Math.floor(Math.random() * 6) + 1;
  const tuTiro = d1 + d2;

  const b1 = Math.floor(Math.random() * 6) + 1;
  const b2 = Math.floor(Math.random() * 6) + 1;
  const botTiro = b1 + b2;

  let resultado, color;
  let ganancia = 0;

  if (tuTiro > botTiro) {
    ganancia = apuesta * 2;
    resultado = '✅ **¡Ganaste!**';
    color = '#22C55E';
  } else if (tuTiro === botTiro) {
    ganancia = apuesta; // empate = devolver
    resultado = '🤝 **¡Empate!** Se devuelve tu apuesta.';
    color = '#FBBF24';
  } else {
    resultado = '❌ **Perdiste.**';
    color = '#EF4444';
  }

  if (ganancia > 0) db_economia.agregarMonedas(userId, ganancia);

  const embed = new EmbedBuilder()
    .setTitle('🎲 Dados')
    .setDescription(
      `**Tú:** ${DICE_EMOJI[d1]} ${DICE_EMOJI[d2]} = **${tuTiro}**\n` +
      `**Bot:** ${DICE_EMOJI[b1]} ${DICE_EMOJI[b2]} = **${botTiro}**\n\n` +
      resultado
    )
    .addFields(
      { name: 'Apuesta', value: `${apuesta} 💰`, inline: true },
      { name: 'Resultado', value: ganancia > apuesta ? `+${ganancia - apuesta} 💰` : ganancia === apuesta ? '±0' : `-${apuesta} 💰`, inline: true },
      { name: 'Saldo', value: `${saldo(userId)} 💰`, inline: true },
    )
    .setColor(color)
    .setTimestamp();

  return interaction.reply({ embeds: [embed] });
}

// ═════════════════════════════════════════════════════════════════════════
// 🔴 RULETA — Rojo/Negro/Verde
// ═════════════════════════════════════════════════════════════════════════

const RULETA_NUMEROS = [];
for (let i = 0; i <= 36; i++) {
  if (i === 0) RULETA_NUMEROS.push({ num: 0, color: 'verde' });
  else if (i % 2 === 0) RULETA_NUMEROS.push({ num: i, color: 'negro' });
  else RULETA_NUMEROS.push({ num: i, color: 'rojo' });
}

export function handleRuleta(interaction) {
  const apuesta = interaction.options.getInteger('apuesta');
  const eleccion = interaction.options.getString('color'); // rojo | negro | verde
  const userId = interaction.user.id;
  const error = verificarApuesta(userId, apuesta);
  if (error) return interaction.reply({ content: error, ephemeral: true });

  db_economia.agregarMonedas(userId, -apuesta);

  const resultado = RULETA_NUMEROS[Math.floor(Math.random() * RULETA_NUMEROS.length)];
  const colorEmoji = { rojo: '🔴', negro: '⚫', verde: '🟢' };
  const gano = eleccion === resultado.color;

  let ganancia = 0;
  if (gano) {
    ganancia = eleccion === 'verde' ? apuesta * 14 : apuesta * 2; // verde paga 14x
    db_economia.agregarMonedas(userId, ganancia);
  }

  const embed = new EmbedBuilder()
    .setTitle('🎡 Ruleta Lush')
    .setDescription(
      `La bola gira...\n\n` +
      `${colorEmoji[resultado.color]} **${resultado.num} ${resultado.color.toUpperCase()}**\n\n` +
      (gano
        ? (eleccion === 'verde'
          ? `🟢🟢🟢 **¡¡VERDE!! x14** 🟢🟢🟢\n+${ganancia} monedas!`
          : `✅ **¡Acertaste!** +${ganancia - apuesta} monedas`)
        : `❌ Apostaste ${colorEmoji[eleccion]} ${eleccion} — no fue esta vez.`)
    )
    .addFields(
      { name: 'Apuesta', value: `${apuesta} 💰 en ${colorEmoji[eleccion]}`, inline: true },
      { name: 'Saldo', value: `${saldo(userId)} 💰`, inline: true },
    )
    .setColor(resultado.color === 'rojo' ? '#EF4444' : resultado.color === 'verde' ? '#22C55E' : '#1F2937')
    .setTimestamp();

  return interaction.reply({ embeds: [embed] });
}

// ═════════════════════════════════════════════════════════════════════════
// 🃏 BLACKJACK — 21 interactivo con botones
// ═════════════════════════════════════════════════════════════════════════

const CARTAS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
const PALOS = ['♠️', '♥️', '♦️', '♣️'];

function crearBaraja() {
  const baraja = [];
  for (const palo of PALOS) {
    for (const carta of CARTAS) {
      baraja.push({ carta, palo, valor: carta === 'A' ? 11 : ['J', 'Q', 'K'].includes(carta) ? 10 : parseInt(carta) });
    }
  }
  // Shuffle
  for (let i = baraja.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [baraja[i], baraja[j]] = [baraja[j], baraja[i]];
  }
  return baraja;
}

function valorMano(mano) {
  let total = mano.reduce((s, c) => s + c.valor, 0);
  let ases = mano.filter(c => c.carta === 'A').length;
  while (total > 21 && ases > 0) {
    total -= 10;
    ases--;
  }
  return total;
}

function mostrarMano(mano) {
  return mano.map(c => `\`${c.carta}${c.palo}\``).join(' ');
}

// Partidas activas
const bjGames = new Map();

export async function handleBlackjack(interaction) {
  const apuesta = interaction.options.getInteger('apuesta');
  const userId = interaction.user.id;
  const error = verificarApuesta(userId, apuesta);
  if (error) return interaction.reply({ content: error, ephemeral: true });

  if (bjGames.has(userId)) {
    return interaction.reply({ content: '❌ Ya tienes una partida activa. Termínala primero.', ephemeral: true });
  }

  db_economia.agregarMonedas(userId, -apuesta);

  const baraja = crearBaraja();
  const jugador = [baraja.pop(), baraja.pop()];
  const dealer = [baraja.pop(), baraja.pop()];

  const game = { baraja, jugador, dealer, apuesta, userId };
  bjGames.set(userId, game);

  // Blackjack natural?
  if (valorMano(jugador) === 21) {
    bjGames.delete(userId);
    const ganancia = Math.floor(apuesta * 2.5);
    db_economia.agregarMonedas(userId, ganancia);

    return interaction.reply({
      embeds: [bjEmbed(game, true, `🃏 **¡BLACKJACK NATURAL!** +${ganancia} monedas`)],
    });
  }

  const buttons = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`bj_hit_${userId}`).setLabel('🃏 Pedir').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId(`bj_stand_${userId}`).setLabel('✋ Plantarse').setStyle(ButtonStyle.Secondary),
  );

  return interaction.reply({
    embeds: [bjEmbed(game, false)],
    components: [buttons],
  });
}

function bjEmbed(game, mostrarDealer, resultado = null) {
  const pj = valorMano(game.jugador);
  const dl = mostrarDealer ? valorMano(game.dealer) : '?';

  const dealerCards = mostrarDealer
    ? mostrarMano(game.dealer)
    : `${mostrarMano([game.dealer[0]])} \`??\``;

  const embed = new EmbedBuilder()
    .setTitle('🃏 Blackjack')
    .setDescription(
      `**Dealer:** ${dealerCards} (${dl})\n` +
      `**Tú:** ${mostrarMano(game.jugador)} (**${pj}**)\n\n` +
      (resultado || '*Pedir o plantarse?*')
    )
    .addFields(
      { name: 'Apuesta', value: `${game.apuesta} 💰`, inline: true },
      { name: 'Saldo', value: `${saldo(game.userId)} 💰`, inline: true },
    )
    .setColor(resultado?.includes('Ganaste') ? '#22C55E' : resultado?.includes('Perdiste') ? '#EF4444' : '#3B82F6')
    .setTimestamp();

  return embed;
}

// Procesar botones de blackjack
export async function handleBjButton(interaction) {
  const [, action, odUserId] = interaction.customId.split('_');
  const userId = interaction.user.id;

  if (userId !== odUserId) {
    return interaction.reply({ content: '❌ Esta no es tu partida.', ephemeral: true });
  }

  const game = bjGames.get(userId);
  if (!game) {
    return interaction.update({ content: 'Esta partida ya terminó.', embeds: [], components: [] });
  }

  if (action === 'hit') {
    game.jugador.push(game.baraja.pop());
    const pj = valorMano(game.jugador);

    if (pj > 21) {
      bjGames.delete(userId);
      return interaction.update({
        embeds: [bjEmbed(game, true, `💥 **¡Te pasaste! (${pj})** — Perdiste ${game.apuesta} monedas`)],
        components: [],
      });
    }

    if (pj === 21) {
      // Auto-stand en 21
      return resolverBj(interaction, game);
    }

    const buttons = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`bj_hit_${userId}`).setLabel('🃏 Pedir').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId(`bj_stand_${userId}`).setLabel('✋ Plantarse').setStyle(ButtonStyle.Secondary),
    );

    return interaction.update({
      embeds: [bjEmbed(game, false)],
      components: [buttons],
    });
  }

  if (action === 'stand') {
    return resolverBj(interaction, game);
  }
}

function resolverBj(interaction, game) {
  bjGames.delete(game.userId);

  // Dealer pide hasta 17
  while (valorMano(game.dealer) < 17) {
    game.dealer.push(game.baraja.pop());
  }

  const pj = valorMano(game.jugador);
  const dl = valorMano(game.dealer);
  let resultado, ganancia = 0;

  if (dl > 21) {
    ganancia = game.apuesta * 2;
    resultado = `✅ **¡Dealer se pasó! (${dl})** — Ganaste +${game.apuesta} monedas`;
  } else if (pj > dl) {
    ganancia = game.apuesta * 2;
    resultado = `✅ **¡Ganaste!** ${pj} vs ${dl} — +${game.apuesta} monedas`;
  } else if (pj === dl) {
    ganancia = game.apuesta;
    resultado = `🤝 **Empate** ${pj} vs ${dl} — Se devuelve tu apuesta`;
  } else {
    resultado = `❌ **Perdiste.** ${pj} vs ${dl} — -${game.apuesta} monedas`;
  }

  if (ganancia > 0) db_economia.agregarMonedas(game.userId, ganancia);

  return interaction.update({
    embeds: [bjEmbed(game, true, resultado)],
    components: [],
  });
}
