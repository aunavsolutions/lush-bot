// src/welcome.js
// Sistema de bienvenida — primer contacto con la familia Lush

import { EmbedBuilder } from 'discord.js';

export async function handleWelcome(member) {
  // Buscar canal de bienvenida (soporta estética con ⌇)
  const welcomeChannel = member.guild.channels.cache.find(
    ch => ch.name.includes('bienvenid') || ch.name.includes('welcome')
  );

  if (!welcomeChannel) return;

  const memberCount = member.guild.memberCount;

  const embed = new EmbedBuilder()
    .setTitle('¡Nuevo miembro en la familia! 🎉')
    .setDescription(
      `¡Bienvenid@ **${member.user.username}** a **Lush Family**!\n\n` +
      `Eres el miembro **#${memberCount}** de la familia.\n\n` +
      `⚠️ **IMPORTANTE:** Para poder interactuar con el servidor, necesitas presentarte.\n` +
      `Usa el comando \`/vincular\` para registrar tu nombre y obtener acceso completo.\n\n` +
      `📋 Revisa las reglas en el canal de reglas.\n` +
      `👋 ¡Nos vemos en el server!`
    )
    .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 256 }))
    .setColor('#3498DB')
    .setFooter({ text: 'Lush Family' })
    .setTimestamp();

  try {
    await welcomeChannel.send({ 
      content: `<@${member.id}>`,
      embeds: [embed] 
    });
  } catch (err) {
    console.error('[Welcome] Error al enviar bienvenida:', err.message);
  }

  try {
    let unverifiedRole = member.guild.roles.cache.find(r => r.name.toLowerCase().includes('no verificado') || r.name.toLowerCase().includes('visitante'));
    if (!unverifiedRole) {
       // Si no existe, intenta crearlo (requiere permisos)
       unverifiedRole = await member.guild.roles.create({ name: 'No Verificado', color: '#95A5A6', reason: 'Rol de verificación automática' });
    }
    if (unverifiedRole) {
       await member.roles.add(unverifiedRole);
    }
  } catch (err) {
    console.error('[Welcome] Error al asignar rol de No Verificado:', err.message);
  }

  // DM al nuevo miembro
  try {
    const dmEmbed = new EmbedBuilder()
      .setTitle('¡Bienvenid@ a Lush Family! 🌟')
      .setDescription(
        `¡Qué bueno tenerte en la familia!\n\n` +
        `Somos una comunidad donde nos divertimos, hablamos de todo y ` +
        `la pasamos bien juntos.\n\n` +
        `Si tienes alguna duda, habla con los sublíderes o el líder. ¡Nos vemos en el server!`
      )
      .setColor('#9B59B6');

    await member.send({ embeds: [dmEmbed] });
  } catch {
    // Si tiene DMs cerrados, no pasa nada
  }
}

export async function handleGoodbye(member) {
  const channel = member.guild.channels.cache.find(
    ch => ch.name.includes('bienvenid') || ch.name.includes('general')
  );

  if (!channel) return;

  try {
    await channel.send(`**${member.user.username}** dejó la familia. 👋`);
  } catch (err) {
    console.error('[Welcome] Error al enviar despedida:', err.message);
  }
}
