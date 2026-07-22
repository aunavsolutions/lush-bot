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
  'lami': 'lick',
  'suplex': 'suplex',
  'esquiv': 'dodge',
  'escond': 'hide',
  'ocult': 'hide',
  'punet': 'punch'
};

// GIFs personalizados/locales con prioridad (URLs directas verificadas)
const CUSTOM_GIFS = {
  kick: [
    'https://media.tenor.com/o52AZQZ_PloAAAAC/kick-anime.gif',
    'https://media.tenor.com/06XcN2z7G0gAAAAC/kick-go-away.gif',
    'https://media.tenor.com/IXWwEYZufdIAAAAC/gojo-vs-miguel-gojo.gif',
    'https://media.tenor.com/Lyqfq7_vJnsAAAAC/kick-funny.gif',
    'https://media.tenor.com/7te6q4wtcYoAAAAC/mad-angry.gif'
  ],
  punch: [
    'https://media.tenor.com/54vXJe6Jj3kAAAAC/spy-family-spy-x-family.gif',
    'https://media.tenor.com/Kbit6lroRFUAAAAC/one-punch-man-saitama.gif',
    'https://media.tenor.com/pNmajM4wmtkAAAAC/punch-smash.gif',
    'https://media.tenor.com/yA_KtmPI1EMAAAAC/hxh-hunter-x-hunter.gif',
    'https://media.tenor.com/Ktd3wl6JEEMAAAAC/punch-anime-girl-punch.gif'
  ],
  slap: [
    'https://media.tenor.com/Ws6Dm1ZW_vMAAAAC/girl-slap.gif',
    'https://media.tenor.com/ykCjxWVvq18AAAAC/slap-slapping.gif',
    'https://media.tenor.com/XiYuU9h44-AAAAAC/anime-slap-mad.gif',
    'https://media.tenor.com/Sv8LQZAoQmgAAAAC/chainsaw-man-csm.gif',
    'https://media.tenor.com/cfobWWgjG8wAAAAC/anime-kaguya-sama.gif'
  ],
  suplex: [
    'https://media.tenor.com/gkYwdy1NWcUAAAAC/nichijou-anime.gif',
    'https://media.tenor.com/N4CSeJCk1HsAAAAC/kureha-sakamachi.gif',
    'https://media.tenor.com/b3qy6Po4-2cAAAAC/hataage-suplex-princess.gif',
    'https://media.tenor.com/DJOClHUo_aUAAAAC/jujutsu-kaisen-megumi-fushiguro.gif',
    'https://media.tenor.com/rwgdnhaZ8UUAAAAC/power-anime.gif',
    'https://media1.tenor.com/m/Xg7T0nZfJpQAAAAd/golden-boy-suplex.gif',
    'https://media1.tenor.com/m/VWCfO2KnoIsAAAAd/suplex-wrestling.gif',
    'https://media1.tenor.com/m/UrA__4JFcq4AAAAd/suplex-anime.gif',
    'https://media1.tenor.com/m/gXF-zxnX4rIAAAAd/suplex.gif'
  ],
  dance_solo: [
    'https://media1.tenor.com/m/e2oA9c3jQ9oAAAAd/chika-dance.gif',
    'https://media1.tenor.com/m/W2o4s1Tiv68AAAAd/anime-dance.gif',
    'https://media1.tenor.com/m/7mBzfXhUMkQAAAAd/hinata-dance.gif',
    'https://media1.tenor.com/m/wI3s9oYBG9UAAAAd/anime-dance.gif'
  ],
  dance_couple: [
    'https://media1.tenor.com/m/yFpxn60R52IAAAAd/toradora-dance.gif',
    'https://media1.tenor.com/m/xK7QBKqH7r8AAAAd/anime-couple-dance.gif',
    'https://media1.tenor.com/m/GrqPHbQHEXAAAAAd/dance-anime.gif',
    'https://media1.tenor.com/m/WbcrMkMEJeoAAAAd/anime-dancing-couple.gif'
  ],
  dodge: [
    'https://media1.tenor.com/m/18m6P4w68WwAAAAd/anime-dodge.gif',
    'https://media1.tenor.com/m/FwBEMeFVWFMAAAAd/dodge-anime.gif',
    'https://media1.tenor.com/m/kHXNXKOFd0EAAAAd/anime-dodge-matrix.gif'
  ],
  hide: [
    'https://media1.tenor.com/m/e5k0lQnN9QMAAAAd/anime-box.gif',
    'https://media1.tenor.com/m/1V3u6T3D98oAAAAd/anime-hide.gif',
    'https://media1.tenor.com/m/ZPpMq1fxJlsAAAAd/hiding-anime.gif'
  ]
};

// GIFs de respaldo si fallan las APIs de internet (fuentes estáticas de Tenor verificadas)
const BACKUP_GIFS = {
  hug: [
    'https://media.tenor.com/kCZWD1UQNu8AAAAC/hug-anime.gif',
    'https://media.tenor.com/hyBept7V48YAAAAC/hug-anime.gif',
    'https://media.tenor.com/xg5sn47URdwAAAAC/anime-hug.gif'
  ],
  kiss: [
    'https://media.tenor.com/PnYn7AQQ4sYAAAAC/anime-kiss.gif',
    'https://media.tenor.com/wDYW7w1Zq7QAAAAC/anime-kiss-kiss.gif'
  ],
  punch: [
    'https://media.tenor.com/Kbit6lroRFUAAAAC/one-punch-man-saitama.gif',
    'https://media.tenor.com/pNmajM4wmtkAAAAC/punch-smash.gif'
  ],
  kick: [
    'https://media.tenor.com/o52AZQZ_PloAAAAC/kick-anime.gif',
    'https://media.tenor.com/Lyqfq7_vJnsAAAAC/kick-funny.gif'
  ],
  slap: [
    'https://media.tenor.com/Ws6Dm1ZW_vMAAAAC/girl-slap.gif',
    'https://media.tenor.com/ykCjxWVvq18AAAAC/slap-slapping.gif'
  ],
  cry: [
    'https://media.tenor.com/w2191k9m_44AAAAC/anime-cry.gif',
    'https://media.tenor.com/978Nf_gJcTYAAAAC/anime-cry-cry.gif'
  ],
  dance: [
    'https://media1.tenor.com/m/e2oA9c3jQ9oAAAAd/chika-dance.gif',
    'https://media1.tenor.com/m/W2o4s1Tiv68AAAAd/anime-dance.gif'
  ],
  pat: [
    'https://media.tenor.com/E65t_0ZCVtcAAAAC/pat-head-head-pat.gif',
    'https://media.tenor.com/N1s726H282wAAAAC/anime-pat.gif'
  ],
  bite: [
    'https://media.tenor.com/snO4Z7Ur71gAAAAC/bite-anime.gif',
    'https://media.tenor.com/39660W_G-a0AAAAC/anime-bite.gif'
  ],
  kill: [
    'https://media.tenor.com/incOq74x200AAAAC/kill-smort.gif',
    'https://media.tenor.com/w1iXN0QJ3Q0AAAAC/kill-anime.gif'
  ],
  smile: [
    'https://media.tenor.com/4qIeO0-835sAAAAC/anime-smile.gif',
    'https://media.tenor.com/uR1dOqJ6w9YAAAAC/smile-anime.gif'
  ],
  wave: [
    'https://media.tenor.com/9qBmsPZ6hcoAAAAC/wave-anime.gif',
    'https://media.tenor.com/1G0hP5m4C4kAAAAC/hello-anime.gif'
  ],
  lick: [
    'https://media.tenor.com/rj1k25Wn5_8AAAAC/lick-anime.gif',
    'https://media.tenor.com/R385q0Vd1nQAAAAC/lick-anime.gif'
  ]
};

// Acciones soportadas por nekos.best
const NEKOS_BEST_ACTIONS = new Set([
  'hug','kiss','punch','kick','slap','cry','dance','pat','bite','kill','smile','wave','lick',
  'baka','blush','cuddle','feed','handhold','highfive','laugh','nod','nope','poke','run',
  'shoot','shrug','sleep','stare','think','thumbsup','tickle','wink','yawn'
]);

async function getGif(action) {
  // 1. Acciones especiales con GIFs custom (suplex, bailes, dodge, hide)
  if (CUSTOM_GIFS[action]) {
    const list = CUSTOM_GIFS[action];
    return list[Math.floor(Math.random() * list.length)];
  }

  // 2. Intentar nekos.best (API dedicada a GIFs de anime, muy fiable)
  if (NEKOS_BEST_ACTIONS.has(action)) {
    try {
      const res = await fetch(`https://nekos.best/api/v2/${action}`);
      if (res.ok) {
        const data = await res.json();
        if (data?.results?.[0]?.url) return data.results[0].url;
      }
    } catch (e) {
      console.error('[Roleplay] nekos.best falló:', e.message);
    }
  }

  // 3. Fallback: otakugifs
  try {
    const res = await fetch(`https://api.otakugifs.xyz/gif?reaction=${action}`);
    if (res.ok) {
      const data = await res.json();
      if (data?.url) return data.url;
    }
  } catch (e) {
    console.error('[Roleplay] otakugifs también falló:', e.message);
  }

  // 4. Último recurso: BACKUP_GIFS estáticos
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
    'da un puñete a': { key: 'punch', desc: '👊 **{user}** le da un tremendo puñete a **{target}**' },
    'le mete un puñete a': { key: 'punch', desc: '👊 **{user}** le da un tremendo puñete a **{target}**' },
    'puñete a': { key: 'punch', desc: '👊 **{user}** le da un tremendo puñete a **{target}**' },
    'cachetea a': { key: 'slap', desc: '🖐️ **{user}** le mete una bofetada a **{target}**' },
    'muerde a': { key: 'bite', desc: '🦷 **{user}** le da una mordida a **{target}**' },
    'mata a': { key: 'kill', desc: '💀 **{user}** eliminó a **{target}** del mapa' },
    'acaricia a': { key: 'pat', desc: '😊 **{user}** acaricia la cabeza de **{target}**' },
    'lame a': { key: 'lick', desc: '👅 **{user}** lame a **{target}**' },
    'le hace un suplex a': { key: 'suplex', desc: '🤼 ¡SUPLEX BRUTAL! **{user}** levanta y azota a **{target}** contra el suelo' },
    'suplex a': { key: 'suplex', desc: '🤼 ¡SUPLEX BRUTAL! **{user}** levanta y azota a **{target}** contra el suelo' },
    'esquiva a': { key: 'dodge', desc: '💨 **{user}** esquiva el ataque de **{target}** con agilidad' }
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
      if (target) {
        actionKey = 'dance_couple';
        description = `💃 **${user}** se pone a bailar alegremente con **${target}** 🎶`;
      } else {
        actionKey = 'dance_solo';
        description = `💃 **${user}** saca sus mejores pasos y se pone a bailar solo`;
      }
      break;
    case 'suplex':
      actionKey = 'suplex';
      description = `🤼 ¡DIOS MÍO! **${user}** le aplica un suplex brutal a **${target}** 💥`;
      break;
    case 'punete':
      actionKey = 'punch';
      description = `👊 ¡POW! **${user}** le da un fuerte puñete a **${target}**`;
      break;
    case 'esquivar':
      actionKey = 'dodge';
      description = `💨 **${user}** esquiva el ataque de **${target}** con reflejos de Matrix`;
      break;
    case 'esconderse':
      actionKey = 'hide';
      description = target
        ? `🫣 **${user}** se esconde rápidamente de **${target}**`
        : `🫣 **${user}** se esconde en una caja de cartón`;
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
        ? 'ℹ️ Actualmente estás soltero/a. ¡El amor llegará pronto! 💕' 
        : `ℹ️ **${target.username}** está soltero/a.`
    });
  }

  await interaction.deferReply();

  const spouseUser = await interaction.client.users.fetch(pareja.pareja_id).catch(() => null);
  const fechaFormat = `<t:${pareja.fecha}:D>`;

  const embed = new EmbedBuilder()
    .setTitle('💍 Registro Matrimonial de la Familia Lush')
    .setDescription(`💘 **${target}** está felizmente casado/a con **${spouseUser || `<@${pareja.pareja_id}>`}**\n\n📅 **Fecha de Unión:** ${fechaFormat}`)
    .setColor('#F1948A')
    .setAuthor({ 
      name: `Matrimonio de ${target.username}`, 
      iconURL: target.displayAvatarURL({ dynamic: true, size: 128 }) 
    })
    .setThumbnail(spouseUser ? spouseUser.displayAvatarURL({ dynamic: true, size: 256 }) : null)
    .setImage('https://media.tenor.com/xswPq6KzM1sAAAAC/anime-kiss.gif')
    .setFooter({ text: 'Lush Family • Amor eterno 💖' })
    .setTimestamp();

  return interaction.editReply({ embeds: [embed] });
}
