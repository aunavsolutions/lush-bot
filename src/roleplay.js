import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { db_matrimonios } from './memory/database.js';

// Diccionario de acciones de Otakugifs
const ACTION_MAP = {
  'abraz': 'hug',
  'bes': 'kiss',
  'peg': 'punch',
  'golp': 'punch',
  'pate': 'kick',
  'bofetad': 'slap',
  'cachetad': 'slap',
  'llor': 'cry',
  'bail': 'dance',
  'acarici': 'pat',
  'mord': 'bite',
  'mat': 'kill',
  'sonri': 'smile',
  'salud': 'wave',
  'lami': 'lick'
};

// GIFs alternativos de respaldo por si falla la API
const BACKUP_GIFS = {
  hug: ['https://media.tenor.com/kCZjHwqwsDsAAAAC/anime-hug.gif', 'https://media.tenor.com/3mr76n545a8AAAAC/hug-anime.gif'],
  kiss: ['https://media.tenor.com/wDYW5wzhy3oAAAAC/anime-kiss.gif', 'https://media.tenor.com/393o4S4wK4oAAAAC/kiss-anime.gif'],
  punch: ['https://media.tenor.com/4t9gHlP4658AAAAC/anime-punch.gif'],
  kick: ['https://media.tenor.com/E57_tOm8g7QAAAAC/anime-kick.gif', 'https://media.tenor.com/y1vOuhK95p8AAAAC/kick-anime-kick.gif'],
  slap: ['https://media.tenor.com/XiYuU9srGToAAAAC/anime-slap-slap.gif'],
  cry: ['https://media.tenor.com/D8aQkQ_Qj3sAAAAd/cry-anime.gif'],
  dance: ['https://media.tenor.com/W2o4s1Tiv68AAAAC/anime-dance.gif', 'https://media.tenor.com/e2oA9c3jQ9oAAAAC/chika-dance.gif'],
  pat: ['https://media.tenor.com/N41zKEDpSnwAAAAC/anime-pat.gif'],
  bite: ['https://media.tenor.com/9dO2Z6C1C5cAAAAC/anime-bite.gif'],
  kill: ['https://media.tenor.com/s6wE19yE2zEAAAAd/kill-kill-ua.gif'],
  smile: ['https://media.tenor.com/8QG_zWbWd44AAAAC/anime-smile.gif'],
  wave: ['https://media.tenor.com/s42iV4X7gK8AAAAd/wave-anime.gif'],
  lick: ['https://media.tenor.com/71K64Nf8oHkAAAAd/anime-lick.gif']
};

async function getGif(action) {
  try {
    const res = await fetch(`https://api.otakugifs.xyz/gif?reaction=${action}`);
    if (res.ok) {
      const data = await res.json();
      if (data && data.url) return data.url;
    }
  } catch (e) {
    console.error('[Roleplay] Error al obtener de otakugifs, usando backup:', e.message);
  }
  const backup = BACKUP_GIFS[action];
  return backup ? backup[Math.floor(Math.random() * backup.length)] : '';
}

// ─── LEER TEXTO PLANO (Roleplay con asteriscos) ─────────────────────────────
export async function checkRoleplay(message) {
  if (message.author.bot) return false;
  
  const content = message.content.trim();
  const regex = /^\*(.+)\*$/;
  const match = content.match(regex);
  if (!match) return false;
  
  const text = match[1].toLowerCase();
  let reaction = null;
  for (const [key, val] of Object.entries(ACTION_MAP)) {
    if (text.includes(key)) {
      reaction = val;
      break;
    }
  }
  
  if (!reaction) return false;

  try {
    const gifUrl = await getGif(reaction);
    const embed = new EmbedBuilder()
      .setDescription(`*${match[1]}*`)
      .setImage(gifUrl)
      .setColor('#9b59b6');
      
    await message.channel.send({ embeds: [embed] });
    return true;
  } catch (err) {
    console.error('[Roleplay] Error en checkRoleplay:', err);
    return false;
  }
}

// ─── LEER LENGUAJE NATURAL (Interacciones directas) ──────────────────────────
export async function checkNaturalRoleplay(message) {
  if (message.author.bot) return false;

  const content = message.content.trim().toLowerCase();
  
  // 1. Detección especial "Lushbot baila"
  const botName = message.client.user.username.toLowerCase();
  if (content.includes(botName) && (content.includes('baila') || content.includes('bailar'))) {
    const gifUrl = await getGif('dance');
    const embed = new EmbedBuilder()
      .setDescription(`💃 **${message.client.user}** saca los prohibidos y se pone a bailar con la familia.`)
      .setImage(gifUrl)
      .setColor('#9b59b6');
    await message.channel.send({ embeds: [embed] });
    return true;
  }

  // 2. Detección de verbos de acción ("patea a X", "abraza a X", etc.)
  const VERBOS = {
    'abraza a': { key: 'hug', desc: '🤗 **{user}** le da un fuerte abrazo a **{target}**' },
    'besa a': { key: 'kiss', desc: '💋 **{user}** le da un tierno beso a **{target}**' },
    'patea a': { key: 'kick', desc: '👣 ¡PUM! **{user}** patea a **{target}**' },
    'golpea a': { key: 'punch', desc: '👊 **{user}** golpea a **{target}**' },
    'pega a': { key: 'punch', desc: '👊 **{user}** le pega a **{target}**' },
    'cachetea a': { key: 'slap', desc: '🖐️ **{user}** le mete una bofetada a **{target}**' },
    'muerde a': { key: 'bite', desc: '🦷 **{user}** le da una mordida a **{target}**' },
    'mata a': { key: 'kill', desc: '💀 **{user}** eliminó a **{target}** del mapa' },
    'acaricia a': { key: 'pat', desc: '😊 **{user}** acaricia la cabeza de **{target}**' },
    'lame a': { key: 'lick', desc: '👅 **{user}** lame a **{target}**' }
  };

  for (const [verbo, info] of Object.entries(VERBOS)) {
    if (content.startsWith(verbo)) {
      const targetText = message.content.slice(verbo.length).trim();
      if (!targetText) continue;

      let target = message.mentions.users.first();
      
      // Intentar buscar por nickname o username si no hay mención
      if (!target) {
        const query = targetText.toLowerCase();
        // Cargar todos los miembros para asegurarnos de que cache.find funcione
        await message.guild.members.fetch().catch(() => null);
        const member = message.guild.members.cache.find(m => 
          m.user.username.toLowerCase().includes(query) || 
          (m.nickname && m.nickname.toLowerCase().includes(query))
        );
        if (member) target = member.user;
      }

      const targetStr = target ? `${target}` : targetText;

      const gifUrl = await getGif(info.key);
      const desc = info.desc.replace('{user}', `${message.author}`).replace('{target}', targetStr);

      const embed = new EmbedBuilder()
        .setDescription(desc)
        .setImage(gifUrl)
        .setColor('#9b59b6');

      await message.channel.send({ embeds: [embed] });
      return true;
    }
  }

  return false;
}

// ─── COMANDOS SLASH DE INTERACCIÓN ──────────────────────────────────────────
export async function handleRoleplayCommand(interaction) {
  const { commandName, options, user } = interaction;
  const target = options.getUser('usuario');
  
  let action = commandName; // abrazar, besar, patear, bofetada, acariciar, morder, matar, bailar
  let actionKey = '';
  let description = '';

  switch (action) {
    case 'abrazar':
      actionKey = 'hug';
      description = `🤗 **${user}** le da un fuerte abrazo a **${target}**`;
      break;
    case 'besar':
      actionKey = 'kiss';
      description = `💋 **${user}** le da un tierno beso a **${target}**`;
      break;
    case 'patear':
      actionKey = 'kick';
      description = `👣 ¡PUM! **${user}** patea a **${target}**`;
      break;
    case 'bofetada':
      actionKey = 'slap';
      description = `🖐️ ¡ZAZ! **${user}** le mete una bofetada a **${target}**`;
      break;
    case 'acariciar':
      actionKey = 'pat';
      description = `😊 **${user}** mima y acaricia la cabeza de **${target}**`;
      break;
    case 'morder':
      actionKey = 'bite';
      description = `🦷 ¡Nom! **${user}** muerde a **${target}**`;
      break;
    case 'matar':
      actionKey = 'kill';
      description = `💀 **${user}** eliminó a **${target}** del mapa`;
      break;
    case 'bailar':
      actionKey = 'dance';
      description = target 
        ? `💃 **${user}** se pone a bailar alegremente con **${target}**`
        : `💃 **${user}** saca sus mejores pasos y se pone a bailar solo`;
      break;
  }

  await interaction.deferReply();
  const gifUrl = await getGif(actionKey);

  const embed = new EmbedBuilder()
    .setDescription(description)
    .setImage(gifUrl)
    .setColor('#9b59b6');

  return interaction.editReply({ embeds: [embed] });
}

// ─── SISTEMA DE MATRIMONIO ──────────────────────────────────────────────────
export async function handleCasarse(interaction) {
  const target = interaction.options.getUser('usuario');
  const author = interaction.user;

  if (target.id === author.id) {
    return interaction.reply({ content: '❌ No puedes casarte contigo mismo (aunque te quieras mucho).', ephemeral: true });
  }
  if (target.bot) {
    return interaction.reply({ content: '❌ Los bots no tienen sentimientos, no puedes casarte con un robot.', ephemeral: true });
  }

  // Verificar si alguno ya está casado
  const parejaAutor = db_matrimonios.obtenerPareja(author.id);
  const parejaTarget = db_matrimonios.obtenerPareja(target.id);

  if (parejaAutor) {
    return interaction.reply({ content: `❌ Ya estás casado con <@${parejaAutor.pareja_id}>. Divórciate primero.`, ephemeral: true });
  }
  if (parejaTarget) {
    return interaction.reply({ content: `❌ **${target.username}** ya está casado/a con alguien más.`, ephemeral: true });
  }

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`boda_aceptar_${target.id}_${author.id}`)
      .setLabel('¡Sí, acepto! 💍')
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId(`boda_rechazar_${target.id}_${author.id}`)
      .setLabel('Rechazar 💔')
      .setStyle(ButtonStyle.Danger)
  );

  return interaction.reply({
    content: `🔔 ¡Atención! **${author}** le ha propuesto matrimonio a **${target}**.\n**${target}**, ¿aceptas casarte y jurar amor eterno en la familia Lush?`,
    components: [row]
  });
}

export async function handleDivorciarse(interaction) {
  const author = interaction.user;
  const pareja = db_matrimonios.obtenerPareja(author.id);

  if (!pareja) {
    return interaction.reply({ content: '❌ Actualmente no estás casado con nadie.', ephemeral: true });
  }

  db_matrimonios.divorciar(author.id);

  const embed = new EmbedBuilder()
    .setTitle('💔 Divorcio Declarado')
    .setDescription(`**${author}** y <@${pareja.pareja_id}> se han divorciado oficialmente. El amor ha terminado.`)
    .setColor('#E74C3C')
    .setImage('https://media.tenor.com/t8lF9s7TfLAAAAAC/anime-cry.gif');

  return interaction.reply({ embeds: [embed] });
}

export async function handlePareja(interaction) {
  const target = interaction.options.getUser('usuario') || interaction.user;
  const pareja = db_matrimonios.obtenerPareja(target.id);

  if (!pareja) {
    return interaction.reply({
      content: target.id === interaction.user.id 
        ? 'ℹ️ Actualmente estás soltero/a. ¡El amor llegará pronto!' 
        : `ℹ️ **${target.username}** está soltero/a.`
    });
  }

  const fechaFormat = `<t:${pareja.fecha}:D>`;
  const embed = new EmbedBuilder()
    .setTitle('💖 Estado Civil: Casados')
    .setDescription(`💘 **${target}** está casado/a con <@${pareja.pareja_id}>\n📅 Casados desde el: ${fechaFormat}`)
    .setColor('#F1948A')
    .setImage('https://media.tenor.com/xswPq6KzM1sAAAAC/anime-kiss.gif');

  return interaction.reply({ embeds: [embed] });
}
