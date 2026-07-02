// src/bank.js
// Sistema bancario — Lush Family
// Billetera (vulnerable) vs Banco (seguro con interés)

import { EmbedBuilder } from 'discord.js';
import { db_economia, db_cooldowns } from './memory/database.js';
import db from './memory/database.js';

// ─── TABLA BANCO ────────────────────────────────────────────────────────

db.exec(`
  CREATE TABLE IF NOT EXISTS banco (
    user_id TEXT PRIMARY KEY,
    deposito INTEGER DEFAULT 0,
    ultimo_interes INTEGER DEFAULT (unixepoch())
  )
`);

function getBanco(userId) {
  let row = db.prepare('SELECT * FROM banco WHERE user_id = ?').get(userId);
  if (!row) {
    db.prepare('INSERT INTO banco (user_id) VALUES (?)').run(userId);
    row = { user_id: userId, deposito: 0, ultimo_interes: Math.floor(Date.now() / 1000) };
  }
  return row;
}

// ─── INTERÉS DIARIO (2%) ────────────────────────────────────────────────

function aplicarInteres(userId) {
  const banco = getBanco(userId);
  const ahora = Math.floor(Date.now() / 1000);
  const horasTranscurridas = (ahora - banco.ultimo_interes) / 3600;

  if (horasTranscurridas >= 24 && banco.deposito > 0) {
    const dias = Math.floor(horasTranscurridas / 24);
    const interes = Math.floor(banco.deposito * 0.02 * dias); // 2% diario
    const cap = Math.min(interes, 5000); // máximo 5000 de interés por ciclo

    if (cap > 0) {
      db.prepare('UPDATE banco SET deposito = deposito + ?, ultimo_interes = ? WHERE user_id = ?')
        .run(cap, ahora, userId);
      return cap;
    }
  }
  return 0;
}

// ═════════════════════════════════════════════════════════════════════════
// 💰 SALDO
// ═════════════════════════════════════════════════════════════════════════

export function handleSaldo(interaction) {
  const userId = interaction.user.id;
  const interes = aplicarInteres(userId);
  const perfil = db_economia.obtener(userId);
  const banco = getBanco(userId);

  const total = perfil.monedas + banco.deposito;
  const barBilletera = total > 0 ? Math.round((perfil.monedas / total) * 20) : 0;
  const barBanco = 20 - barBilletera;

  const embed = new EmbedBuilder()
    .setTitle(`🏦 Estado Financiero — ${interaction.user.username}`)
    .setColor('#2563EB')
    .addFields(
      { name: '👛 Billetera', value: `**${perfil.monedas.toLocaleString()}** 💰\n\`${'🟡'.repeat(Math.min(barBilletera, 20))}${'⚪'.repeat(Math.max(20 - barBilletera, 0))}\``, inline: true },
      { name: '🏦 Banco', value: `**${banco.deposito.toLocaleString()}** 💰\n\`${'🔵'.repeat(Math.min(barBanco, 20))}${'⚪'.repeat(Math.max(20 - barBanco, 0))}\``, inline: true },
      { name: '💎 Total', value: `**${total.toLocaleString()}** 💰`, inline: true },
    )
    .setFooter({ text: `📈 Interés diario: 2% (máx. 5,000/día)${interes > 0 ? ` • +${interes} interés aplicado` : ''}` })
    .setTimestamp();

  return interaction.reply({ embeds: [embed] });
}

// ═════════════════════════════════════════════════════════════════════════
// 📥 DEPOSITAR
// ═════════════════════════════════════════════════════════════════════════

export function handleDepositar(interaction) {
  const userId = interaction.user.id;
  const cantidad = interaction.options.getInteger('cantidad');
  const perfil = db_economia.obtener(userId);

  if (cantidad < 1) return interaction.reply({ content: '❌ Cantidad inválida.', ephemeral: true });
  if (perfil.monedas < cantidad) {
    return interaction.reply({ content: `❌ Solo tienes **${perfil.monedas}** 💰 en tu billetera.`, ephemeral: true });
  }

  aplicarInteres(userId);
  db_economia.agregarMonedas(userId, -cantidad);
  db.prepare('UPDATE banco SET deposito = deposito + ? WHERE user_id = ?').run(cantidad, userId);

  const banco = getBanco(userId);

  const embed = new EmbedBuilder()
    .setTitle('📥 Depósito Exitoso')
    .setDescription(`Depositaste **${cantidad.toLocaleString()}** 💰 en el banco.`)
    .setColor('#22C55E')
    .addFields(
      { name: '👛 Billetera', value: `${(perfil.monedas - cantidad).toLocaleString()} 💰`, inline: true },
      { name: '🏦 Banco', value: `${banco.deposito.toLocaleString()} 💰`, inline: true },
    )
    .setFooter({ text: '🔒 Tu dinero está seguro en el banco • 📈 Genera 2% diario' })
    .setTimestamp();

  return interaction.reply({ embeds: [embed] });
}

// ═════════════════════════════════════════════════════════════════════════
// 📤 RETIRAR
// ═════════════════════════════════════════════════════════════════════════

export function handleRetirar(interaction) {
  const userId = interaction.user.id;
  const cantidad = interaction.options.getInteger('cantidad');

  aplicarInteres(userId);
  const banco = getBanco(userId);

  if (cantidad < 1) return interaction.reply({ content: '❌ Cantidad inválida.', ephemeral: true });
  if (banco.deposito < cantidad) {
    return interaction.reply({ content: `❌ Solo tienes **${banco.deposito}** 💰 en el banco.`, ephemeral: true });
  }

  db.prepare('UPDATE banco SET deposito = deposito - ? WHERE user_id = ?').run(cantidad, userId);
  db_economia.agregarMonedas(userId, cantidad);

  const perfil = db_economia.obtener(userId);

  const embed = new EmbedBuilder()
    .setTitle('📤 Retiro Exitoso')
    .setDescription(`Retiraste **${cantidad.toLocaleString()}** 💰 del banco.`)
    .setColor('#F59E0B')
    .addFields(
      { name: '👛 Billetera', value: `${perfil.monedas.toLocaleString()} 💰`, inline: true },
      { name: '🏦 Banco', value: `${(banco.deposito - cantidad).toLocaleString()} 💰`, inline: true },
    )
    .setFooter({ text: '⚠️ El dinero en la billetera es vulnerable a /robar' })
    .setTimestamp();

  return interaction.reply({ embeds: [embed] });
}

// ═════════════════════════════════════════════════════════════════════════
// 💸 TRANSFERIR
// ═════════════════════════════════════════════════════════════════════════

export function handleTransferir(interaction) {
  const userId = interaction.user.id;
  const destino = interaction.options.getUser('usuario');
  const cantidad = interaction.options.getInteger('cantidad');

  if (destino.id === userId) return interaction.reply({ content: '❌ No puedes transferirte a ti mismo.', ephemeral: true });
  if (destino.bot) return interaction.reply({ content: '❌ No puedes transferir a un bot.', ephemeral: true });
  if (cantidad < 1) return interaction.reply({ content: '❌ Cantidad inválida.', ephemeral: true });

  const perfil = db_economia.obtener(userId);
  if (perfil.monedas < cantidad) {
    return interaction.reply({ content: `❌ Solo tienes **${perfil.monedas}** 💰 en tu billetera.`, ephemeral: true });
  }

  db_economia.agregarMonedas(userId, -cantidad);
  db_economia.agregarMonedas(destino.id, cantidad);

  const embed = new EmbedBuilder()
    .setTitle('💸 Transferencia Exitosa')
    .setDescription(
      `**${interaction.user.username}** → **${destino.username}**\n\n` +
      `💰 **${cantidad.toLocaleString()}** monedas transferidas`
    )
    .setColor('#8B5CF6')
    .setFooter({ text: `Saldo restante: ${(perfil.monedas - cantidad).toLocaleString()} 💰` })
    .setTimestamp();

  return interaction.reply({ embeds: [embed] });
}

// ═════════════════════════════════════════════════════════════════════════
// 🦹 ROBAR
// ═════════════════════════════════════════════════════════════════════════

export function handleRobar(interaction) {
  const userId = interaction.user.id;
  const victima = interaction.options.getUser('usuario');

  if (victima.id === userId) return interaction.reply({ content: '❌ No puedes robarte a ti mismo.', ephemeral: true });
  if (victima.bot) return interaction.reply({ content: '❌ No puedes robar a un bot.', ephemeral: true });

  // Cooldown 30 min
  const cdKey = `robar_${userId}`;
  const ahora = Math.floor(Date.now() / 1000);
  const ultimoRobo = db_cooldowns.obtener(cdKey);
  if (ultimoRobo && (ahora - ultimoRobo) < 1800) {
    const restante = 1800 - (ahora - ultimoRobo);
    const min = Math.floor(restante / 60);
    return interaction.reply({ content: `⏳ Espera **${min} min** antes de robar de nuevo.`, ephemeral: true });
  }

  const perfilVictima = db_economia.obtener(victima.id);
  if (perfilVictima.monedas < 100) {
    return interaction.reply({ content: `❌ **${victima.username}** tiene muy poco en su billetera (< 100💰). No vale la pena.`, ephemeral: true });
  }

  // Registrar cooldown
  db_cooldowns.establecer(cdKey, ahora);

  const roll = Math.random() * 100;
  const perfilLadron = db_economia.obtener(userId);

  // 40% — ÉXITO
  if (roll < 40) {
    const porcentaje = (Math.random() * 20 + 10) / 100; // 10-30%
    const robado = Math.floor(perfilVictima.monedas * porcentaje);

    db_economia.agregarMonedas(victima.id, -robado);
    db_economia.agregarMonedas(userId, robado);

    const embed = new EmbedBuilder()
      .setTitle('🦹 ¡Robo Exitoso!')
      .setDescription(
        `**${interaction.user.username}** le robó a **${victima.username}**\n\n` +
        `💰 **+${robado.toLocaleString()}** monedas robadas\n\n` +
        `*${victima.username} debió depositar en el banco... 🏦*`
      )
      .setColor('#22C55E')
      .setFooter({ text: `Tu saldo: ${(perfilLadron.monedas + robado).toLocaleString()} 💰 • ⏳ Cooldown: 30 min` })
      .setTimestamp();

    return interaction.reply({ embeds: [embed] });
  }

  // 30% — FALLO
  if (roll < 70) {
    const embed = new EmbedBuilder()
      .setTitle('😶 Robo Fallido')
      .setDescription(
        `**${interaction.user.username}** intentó robar a **${victima.username}**...\n\n` +
        `Pero no encontró nada. Se fue con las manos vacías. 🤷`
      )
      .setColor('#6B7280')
      .setFooter({ text: '⏳ Cooldown: 30 min' })
      .setTimestamp();

    return interaction.reply({ embeds: [embed] });
  }

  // 30% — ATRAPADO (multa)
  const multaPct = (Math.random() * 10 + 10) / 100; // 10-20%
  const multa = Math.floor(perfilLadron.monedas * multaPct);
  db_economia.agregarMonedas(userId, -multa);

  const embed = new EmbedBuilder()
    .setTitle('🚨 ¡Te Atraparon!')
    .setDescription(
      `**${interaction.user.username}** intentó robar a **${victima.username}**...\n\n` +
      `🚔 **¡Pero lo atraparon!**\n` +
      `💸 Multa: **-${multa.toLocaleString()}** monedas\n\n` +
      `*La próxima vez deposita en el banco antes de robar... 🏦*`
    )
    .setColor('#EF4444')
    .setFooter({ text: `Tu saldo: ${(perfilLadron.monedas - multa).toLocaleString()} 💰 • ⏳ Cooldown: 30 min` })
    .setTimestamp();

  return interaction.reply({ embeds: [embed] });
}
