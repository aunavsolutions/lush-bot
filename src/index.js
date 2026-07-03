import 'dotenv/config';
import http from 'http';
import { createRequire } from 'module';
import { execSync } from 'child_process';
import { Client, GatewayIntentBits, Partials, Events } from 'discord.js';
import onMessageCreate from './events/messageCreate.js';
import { handleCommand } from './commands/index.js';

import { handleWelcome, handleGoodbye } from './welcome.js';



const PORT = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    status: 'online',
    bot: process.env.BOT_NAME || 'Lush Bot',
    uptime: Math.floor(process.uptime()),
  }));
});

server.listen(PORT, () => {
  console.log(`🌐 Health check server en puerto ${PORT}`);
});

// ─── VALIDACIÓN VARIABLES ───────────────────────────────────────────────

const REQUIRED_VARS = ['DISCORD_TOKEN', 'DISCORD_CLIENT_ID'];
const OPTIONAL_VARS = ['GEMINI_API_KEY'];

const missing = REQUIRED_VARS.filter(v => !process.env[v]);

if (missing.length > 0) {
  console.error(`❌ Faltan variables OBLIGATORIAS: ${missing.join(', ')}`);
  console.error('   Configura estas variables en Railway (Settings → Variables)');
  process.exit(1);
}

const missingOptional = OPTIONAL_VARS.filter(v => !process.env[v]);
if (missingOptional.length > 0) {
  console.warn(`⚠️ Variables opcionales faltantes: ${missingOptional.join(', ')}`);
  console.warn('   El bot funcionará pero sin funciones de IA (Gemini)');
}

// ─── CLIENTE DISCORD ───────────────────────────────────────────────────

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildVoiceStates,
  ],
  partials: [Partials.Message, Partials.Channel],
});

// ─── STATUS ─────────────────────────────────────────────────────────────

const STATUS_LIST = [
  { text: 'Audition Latino 💃', type: 0 },
  { text: 'los beats de la fam', type: 2 },
  { text: 'Lush Family 🐱🐟', type: 0 },
];

let i = 0;

function rotarStatus() {
  const s = STATUS_LIST[i % STATUS_LIST.length];
  client.user.setActivity(s.text, { type: s.type });
  i++;
}

// ─── READY ───────────────────────────────────────────────────────────────

client.once(Events.ClientReady, () => {
  console.log(`✅ ${client.user.tag} listo`);
  console.log(`📡 Servidores: ${client.guilds.cache.size}`);

  rotarStatus();
  setInterval(rotarStatus, 5 * 60 * 1000);

  // Auto-configurar límites de usuarios en canales de voz "(X personas)"
  client.guilds.cache.forEach(guild => {
    const botMember = guild.members.me;
    guild.channels.cache.filter(c => c.isVoiceBased()).forEach(channel => {
      const match = channel.name.match(/\((\d+)\s*personas?\)/i);
      if (!match) return;
      const limit = parseInt(match[1], 10);
      if (limit <= 0 || limit > 99 || channel.userLimit === limit) return;

      // Solo intentar si el bot tiene permiso de Gestionar Canal
      const perms = channel.permissionsFor(botMember);
      if (!perms || !perms.has('ManageChannels')) {
        console.warn(`[Auto-Limit] Sin permisos en "${channel.name}" — omitido.`);
        return;
      }

      channel.setUserLimit(limit)
        .then(() => console.log(`[Auto-Limit] Canal "${channel.name}" configurado a ${limit} usuarios.`))
        .catch(err => console.error(`[Auto-Limit] Error en "${channel.name}":`, err.message));
    });
  });
});

client.on(Events.ChannelCreate, channel => {
  if (!channel.isVoiceBased()) return;
  const match = channel.name.match(/\((\d+)\s*personas?\)/i);
  if (!match) return;
  const limit = parseInt(match[1], 10);
  if (limit <= 0 || limit > 99 || channel.userLimit === limit) return;
  const perms = channel.permissionsFor(channel.guild.members.me);
  if (!perms || !perms.has('ManageChannels')) return;
  channel.setUserLimit(limit).catch(err => console.error(`[Auto-Limit] ChannelCreate error:`, err.message));
});

client.on(Events.ChannelUpdate, (oldChannel, newChannel) => {
  if (!newChannel.isVoiceBased() || oldChannel.name === newChannel.name) return;
  const match = newChannel.name.match(/\((\d+)\s*personas?\)/i);
  if (!match) return;
  const limit = parseInt(match[1], 10);
  if (limit <= 0 || limit > 99 || newChannel.userLimit === limit) return;
  const perms = newChannel.permissionsFor(newChannel.guild.members.me);
  if (!perms || !perms.has('ManageChannels')) return;
  newChannel.setUserLimit(limit).catch(err => console.error(`[Auto-Limit] ChannelUpdate error:`, err.message));
});

// ─── MENSAJES ───────────────────────────────────────────────────────────

client.on('messageCreate', async (message) => {
  try {
    await onMessageCreate(message);
  } catch (err) {
    console.error('[MessageCreate] Error no capturado:', err.message);
  }
});

// ─── INTERACCIONES (SLASH COMMANDS) ──────────────────────────────────────

client.on('interactionCreate', async (interaction) => {
  // Componentes de la tienda (menú de categorías, botón volver)
  if (interaction.isStringSelectMenu() && interaction.customId === 'shop_category') {
    const { buildShopEmbed } = await import('./shop.js');
    const category = interaction.values[0];
    const result = buildShopEmbed(category);
    if (result) {
      return interaction.update({ embeds: [result.embed], components: result.components });
    }
  }

  // Menú de la guía de comandos
  if (interaction.isStringSelectMenu() && interaction.customId === 'guia_menu') {
    const { getGuiaEmbed } = await import('./commands/index.js');
    const category = interaction.values[0];
    const embed = getGuiaEmbed(category, interaction.client.user.displayAvatarURL());
    if (embed) {
      return interaction.update({ embeds: [embed] });
    }
  }

  if (interaction.isButton() && interaction.customId === 'shop_back') {
    const { buildShopEmbed } = await import('./shop.js');
    const { embed, components } = buildShopEmbed();
    return interaction.update({ embeds: [embed], components });
  }

  // Blackjack (hit/stand)
  if (interaction.isButton() && interaction.customId.startsWith('bj_')) {
    const { handleBjButton } = await import('./casino.js');
    return handleBjButton(interaction);
  }

  // Duelos (aceptar/rechazar)
  if (interaction.isButton() && interaction.customId.startsWith('duelo_')) {
    const { handleDueloButton } = await import('./minigames.js');
    return handleDueloButton(interaction);
  }

  // Matrimonios (aceptar/rechazar)
  if (interaction.isButton() && interaction.customId.startsWith('boda_')) {
    const parts = interaction.customId.split('_');
    const action = parts[1];
    const targetId = parts[2];
    const authorId = parts[3];

    if (interaction.user.id !== targetId) {
      return interaction.reply({ content: '❌ No puedes responder a esta propuesta, no es para ti.', ephemeral: true });
    }

    if (action === 'rechazar') {
      return interaction.update({
        content: `💔 **<@${targetId}>** ha rechazado la propuesta de matrimonio de **<@${authorId}>**. F en el chat.`,
        components: []
      });
    }

    if (action === 'aceptar') {
      const { db_matrimonios } = await import('./memory/database.js');
      const exito = db_matrimonios.proponer(authorId, targetId);

      if (!exito) {
        return interaction.update({
          content: '❌ No se pudo completar el matrimonio. Es posible que uno de los dos ya se haya casado.',
          components: []
        });
      }

      const channelAnuncios = interaction.guild.channels.cache.find(ch => ch.name.toLowerCase().includes('anuncio'));
      if (channelAnuncios) {
        const { EmbedBuilder } = await import('discord.js');
        const authorUser = await interaction.client.users.fetch(authorId).catch(() => null);
        const targetUser = await interaction.client.users.fetch(targetId).catch(() => null);

        const embedBoda = new EmbedBuilder()
          .setTitle('🔔 ¡Nueva Boda en la Familia Lush! 💍')
          .setDescription(`🎉 Queremos anunciar con inmensa alegría que **<@${authorId}>** y **<@${targetId}>** se han jurado amor eterno hoy.\n\n¡Felicidades a la hermosa pareja! Que su amor dure para siempre. 💖`)
          .setColor('#F1948A')
          .setAuthor({ 
            name: authorUser ? authorUser.username : 'Lush', 
            iconURL: authorUser ? authorUser.displayAvatarURL({ dynamic: true }) : null 
          })
          .setThumbnail(targetUser ? targetUser.displayAvatarURL({ dynamic: true }) : null)
          .setImage('https://media.tenor.com/xswPq6KzM1sAAAAC/anime-kiss.gif')
          .setFooter({ text: 'Lush Family • ¡Que vivan los novios! 🎉' })
          .setTimestamp();
        
        await channelAnuncios.send({ embeds: [embedBoda] }).catch(() => null);
      }

      return interaction.update({
        content: `🎉 ¡VIVAN LOS NOVIOS! 💍 **<@${authorId}>** y **<@${targetId}>** se han casado oficialmente. Que tengan una hermosa vida en Lush. 💖`,
        components: []
      });
    }
  }

  // Modal: /vincular (nick + presentación)
  if (interaction.isModalSubmit() && interaction.customId === 'modal_vincular') {
    await interaction.deferReply({ ephemeral: true });
    const { EmbedBuilder } = await import('discord.js');

    const nick = interaction.fields.getTextInputValue('input_nick').trim();
    const presentacion = interaction.fields.getTextInputValue('input_presentacion').trim();
    const miembro = interaction.member;
    const guild = interaction.guild;

    try {
      // Poner apodo
      const nuevoApodo = `[${nick}] ${interaction.user.username}`.substring(0, 32);
      await miembro.setNickname(nuevoApodo).catch(() => null);

      // Buscar rol Miembro
      const rolMiembro = guild.roles.cache.find(r =>
        r.name.toLowerCase() === 'miembro' ||
        r.name.toLowerCase().includes('miembro') ||
        r.name.toLowerCase().includes('registrado') ||
        r.name.toLowerCase().includes('novato')
      );
      if (rolMiembro) await miembro.roles.add(rolMiembro).catch(() => null);

      // Quitar "No Verificado"
      const rolNoVerif = miembro.roles.cache.find(r =>
        r.name.toLowerCase().includes('no verificado') || r.name.toLowerCase().includes('visitante')
      );
      if (rolNoVerif) await miembro.roles.remove(rolNoVerif).catch(() => null);

      // Publicar presentación en el canal de presentaciones
      const canalPres = guild.channels.cache.find(ch =>
        ch.name.toLowerCase().includes('presentacion') || ch.name.toLowerCase().includes('presentación')
      );

      if (canalPres) {
        const embedPres = new EmbedBuilder()
          .setTitle(`👋 ¡Nueva presentación! — ${nick}`)
          .setDescription(presentacion)
          .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true, size: 256 }))
          .setColor('#2ECC71')
          .addFields({ name: '🎮 Nick en Audition', value: nick, inline: true })
          .setFooter({ text: `Lush Family • ${interaction.user.username}` })
          .setTimestamp();

        await canalPres.send({ embeds: [embedPres] }).catch(() => null);
      }

      return interaction.editReply(
        `✅ ¡Bienvenid@ a la familia **Lush**!\n` +
        `Tu nick **${nick}** ha sido registrado y ya tienes acceso completo al servidor. 🐟\n\n` +
        (canalPres ? `Tu presentación fue publicada en <#${canalPres.id}> ¡ve a saludar!` : '')
      );
    } catch (err) {
      console.error('[Modal Vincular] Error:', err);
      return interaction.editReply('❌ Hubo un error al registrarte. Contacta a un admin.');
    }
  }

  if (!interaction.isChatInputCommand()) return;

  console.log(`[CMD] /${interaction.commandName} por ${interaction.user.username}`);

  try {
    await handleCommand(interaction);
  } catch (err) {
    console.error('❌ ERROR EN COMMAND:', err);

    try {
      if (interaction.deferred || interaction.replied) {
        await interaction.editReply('❌ Error interno del bot.');
      } else {
        await interaction.reply({
          content: '❌ Error interno del bot.',
          ephemeral: true
        });
      }
    } catch (e) {
      console.error('❌ ERROR RESPONDIENDO ERROR:', e.message);
    }
  }
});

// ─── BIENVENIDAS ─────────────────────────────────────────────────────────

client.on('guildMemberAdd', handleWelcome);
client.on('guildMemberRemove', handleGoodbye);

// ─── ERRORES GLOBALES ────────────────────────────────────────────────────

client.on('error', (err) => {
  console.error('[Discord error]', err.message);
});

process.on('unhandledRejection', (err) => {
  console.error('[Unhandled rejection]', err);
});

process.on('uncaughtException', (err) => {
  console.error('[Uncaught exception]', err);
});

// ─── LOGIN ───────────────────────────────────────────────────────────────

console.log('🔄 Intentando conectar al bot...');

client.login(process.env.DISCORD_TOKEN)
  .then(() => console.log('🔌 Conectado a Discord'))
  .catch(err => {
    console.error('❌ Login error:', err.message);
    process.exit(1);
  });