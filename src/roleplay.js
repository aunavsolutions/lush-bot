import { EmbedBuilder } from 'discord.js';

// Diccionario básico de acciones
const ACTION_MAP = {
  'abraz': 'hug',
  'bes': 'kiss',
  'peg': 'punch',
  'golp': 'punch',
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

export async function checkRoleplay(message) {
  if (message.author.bot) return false;
  
  const content = message.content.trim();
  
  // Detecta cosas como "*aure abrazó a aether*"
  const regex = /^\*(.+)\*$/;
  const match = content.match(regex);
  
  if (!match) return false;
  
  const text = match[1].toLowerCase();
  
  // Buscar qué acción es
  let reaction = null;
  for (const [key, val] of Object.entries(ACTION_MAP)) {
    if (text.includes(key)) {
      reaction = val;
      break;
    }
  }
  
  if (!reaction) return false;

  try {
    // Buscar un gif anime en otakugifs
    const res = await fetch(`https://api.otakugifs.xyz/gif?reaction=${reaction}`);
    if (!res.ok) return false;
    
    const data = await res.json();
    
    const embed = new EmbedBuilder()
      .setDescription(`*${match[1]}*`)
      .setImage(data.url)
      .setColor('#9b59b6');
      
    await message.channel.send({ embeds: [embed] });
    return true;
  } catch (err) {
    console.error('[Roleplay] Error fetching gif:', err);
    return false;
  }
}
