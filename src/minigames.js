// src/minigames.js
// Mini-juegos divertidos — Lush Family

import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';

// ═════════════════════════════════════════════════════════════════════════
// ✊ PIEDRA, PAPEL O TIJERAS
// ═════════════════════════════════════════════════════════════════════════

export function handlePPT(interaction) {
  const eleccion = interaction.options.getString('jugada');
  const opciones = ['piedra', 'papel', 'tijeras'];
  const emojis = { piedra: '🪨', papel: '📄', tijeras: '✂️' };
  const bot = opciones[Math.floor(Math.random() * 3)];

  let resultado, color;
  if (eleccion === bot) {
    resultado = '🤝 **¡Empate!**';
    color = '#FBBF24';
  } else if (
    (eleccion === 'piedra' && bot === 'tijeras') ||
    (eleccion === 'papel' && bot === 'piedra') ||
    (eleccion === 'tijeras' && bot === 'papel')
  ) {
    resultado = '✅ **¡Ganaste!** 🎉';
    color = '#22C55E';
  } else {
    resultado = '❌ **Perdiste...**';
    color = '#EF4444';
  }

  const embed = new EmbedBuilder()
    .setTitle('✊ Piedra, Papel o Tijeras')
    .setDescription(
      `**Tú:** ${emojis[eleccion]} ${eleccion}\n` +
      `**Bot:** ${emojis[bot]} ${bot}\n\n` +
      resultado
    )
    .setColor(color)
    .setTimestamp();

  return interaction.reply({ embeds: [embed] });
}

// ═════════════════════════════════════════════════════════════════════════
// 🎱 BOLA MÁGICA
// ═════════════════════════════════════════════════════════════════════════

const RESPUESTAS_8BALL = [
  // Positivas
  '✅ Sin duda alguna.', '✅ Definitivamente sí.', '✅ Todo apunta a que sí.',
  '✅ Las estrellas dicen que sí. ⭐', '✅ Obvio, ¿qué esperabas? 😏',
  '✅ Sí, pero no se lo digas a nadie. 🤫',
  // Neutras
  '🤔 Mmm... pregunta de nuevo.', '🤔 No estoy seguro, intenta más tarde.',
  '🤔 Mejor no te digo ahora...', '🤔 Concéntrate y pregunta de nuevo.',
  // Negativas
  '❌ No cuentes con ello.', '❌ La respuesta es no. 😬',
  '❌ Mis fuentes dicen que no.', '❌ JAJAJA no. 💀',
  '❌ Ni en tus sueños.', '❌ F en el chat por ti. 🪦',
];

export function handle8Ball(interaction) {
  const pregunta = interaction.options.getString('pregunta');
  const respuesta = RESPUESTAS_8BALL[Math.floor(Math.random() * RESPUESTAS_8BALL.length)];

  const embed = new EmbedBuilder()
    .setTitle('🎱 Bola Mágica')
    .setDescription(`**Pregunta:** ${pregunta}\n\n**Respuesta:** ${respuesta}`)
    .setColor('#1F2937')
    .setTimestamp();

  return interaction.reply({ embeds: [embed] });
}

// ═════════════════════════════════════════════════════════════════════════
// 🔢 ADIVINA EL NÚMERO
// ═════════════════════════════════════════════════════════════════════════

export function handleAdivina(interaction) {
  const guess = interaction.options.getInteger('numero');
  const secreto = Math.floor(Math.random() * 10) + 1;

  const diff = Math.abs(guess - secreto);
  let resultado, color;

  if (guess === secreto) {
    resultado = '🎯 **¡EXACTO!** ¡Eres un genio! 🧠✨';
    color = '#22C55E';
  } else if (diff === 1) {
    resultado = `😤 **¡Casi!** Era el **${secreto}**. ¡Tan cerca!`;
    color = '#FBBF24';
  } else {
    resultado = `❌ **Nope.** Era el **${secreto}**. Mejor suerte la próxima.`;
    color = '#EF4444';
  }

  const embed = new EmbedBuilder()
    .setTitle('🔢 Adivina el Número (1-10)')
    .setDescription(`Tu número: **${guess}**\n\n${resultado}`)
    .setColor(color)
    .setTimestamp();

  return interaction.reply({ embeds: [embed] });
}

// ═════════════════════════════════════════════════════════════════════════
// 💕 SHIP — Compatibilidad
// ═════════════════════════════════════════════════════════════════════════

export function handleShip(interaction) {
  const user1 = interaction.options.getUser('persona1');
  const user2 = interaction.options.getUser('persona2');

  // Generar % consistente basado en los IDs (siempre da el mismo resultado para la misma pareja)
  const seed = parseInt(user1.id.slice(-4), 10) + parseInt(user2.id.slice(-4), 10);
  const porcentaje = ((seed * 7 + 13) % 101);

  let mensaje, emoji;
  if (porcentaje >= 90) { mensaje = '¡ALMAS GEMELAS! Boda cuando? 💒'; emoji = '💖💖💖'; }
  else if (porcentaje >= 70) { mensaje = '¡Tienen mucha química! 🔥'; emoji = '💕💕'; }
  else if (porcentaje >= 50) { mensaje = 'Hay potencial... 👀'; emoji = '💛'; }
  else if (porcentaje >= 30) { mensaje = 'Solo amigos... por ahora. 😅'; emoji = '💙'; }
  else { mensaje = 'Mejor quédense como conocidos. 💀'; emoji = '💔'; }

  const barra = '█'.repeat(Math.floor(porcentaje / 5)) + '░'.repeat(20 - Math.floor(porcentaje / 5));

  const embed = new EmbedBuilder()
    .setTitle(`💕 Ship — ${user1.username} x ${user2.username}`)
    .setDescription(
      `${emoji}\n\n` +
      `\`[${barra}]\` **${porcentaje}%**\n\n` +
      `${mensaje}`
    )
    .setColor(porcentaje >= 70 ? '#EC4899' : porcentaje >= 50 ? '#FBBF24' : '#6B7280')
    .setTimestamp();

  return interaction.reply({ embeds: [embed] });
}

// ═════════════════════════════════════════════════════════════════════════
// 🎯 DUELO — Desafía a otro usuario
// ═════════════════════════════════════════════════════════════════════════

const duelos = new Map();

export async function handleDuelo(interaction) {
  const retado = interaction.options.getUser('usuario');
  const retador = interaction.user;

  if (retado.id === retador.id) {
    return interaction.reply({ content: '❌ No puedes retarte a ti mismo. 🤨', ephemeral: true });
  }
  if (retado.bot) {
    return interaction.reply({ content: '❌ No puedes retar a un bot.', ephemeral: true });
  }

  const duelId = `${retador.id}_${retado.id}`;
  duelos.set(duelId, { retador, retado });

  const buttons = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`duelo_accept_${duelId}`).setLabel('⚔️ Aceptar').setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId(`duelo_reject_${duelId}`).setLabel('🏳️ Rechazar').setStyle(ButtonStyle.Danger),
  );

  const embed = new EmbedBuilder()
    .setTitle('⚔️ ¡Duelo!')
    .setDescription(`**${retador.username}** reta a **${retado.username}** a un duelo.\n\n${retado}, ¿aceptas el desafío?`)
    .setColor('#FF6B35')
    .setTimestamp();

  return interaction.reply({ embeds: [embed], components: [buttons] });
}

export async function handleDueloButton(interaction) {
  const [, action, ...rest] = interaction.customId.split('_');
  const duelId = rest.join('_');
  const duelo = duelos.get(duelId);

  if (!duelo) return interaction.update({ content: 'Este duelo ya expiró.', embeds: [], components: [] });

  // Solo el retado puede responder
  if (interaction.user.id !== duelo.retado.id) {
    return interaction.reply({ content: '❌ Este duelo no es para ti.', ephemeral: true });
  }

  if (action === 'reject') {
    duelos.delete(duelId);
    return interaction.update({
      embeds: [new EmbedBuilder()
        .setTitle('🏳️ Duelo Rechazado')
        .setDescription(`**${duelo.retado.username}** rechazó el duelo.`)
        .setColor('#6B7280')],
      components: [],
    });
  }

  // Aceptado — simular combate
  duelos.delete(duelId);
  const rondas = [];
  let hp1 = 100, hp2 = 100;

  for (let i = 0; i < 5 && hp1 > 0 && hp2 > 0; i++) {
    const dmg1 = Math.floor(Math.random() * 30) + 5;
    const dmg2 = Math.floor(Math.random() * 30) + 5;
    hp2 = Math.max(0, hp2 - dmg1);
    hp1 = Math.max(0, hp1 - dmg2);
    rondas.push(`⚔️ R${i + 1}: ${duelo.retador.username} (-${dmg1}) vs ${duelo.retado.username} (-${dmg2})`);
  }

  const ganador = hp1 > hp2 ? duelo.retador : hp2 > hp1 ? duelo.retado : null;

  const embed = new EmbedBuilder()
    .setTitle('⚔️ ¡Resultado del Duelo!')
    .setDescription(
      rondas.join('\n') + '\n\n' +
      `❤️ ${duelo.retador.username}: **${hp1} HP**\n` +
      `❤️ ${duelo.retado.username}: **${hp2} HP**\n\n` +
      (ganador ? `🏆 **¡${ganador.username} gana!**` : '🤝 **¡Empate!**')
    )
    .setColor(ganador ? '#FFD700' : '#6B7280')
    .setTimestamp();

  return interaction.update({ embeds: [embed], components: [] });
}
