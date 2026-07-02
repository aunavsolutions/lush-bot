import { db_economia, db_recursos, db_cooldowns } from './memory/database.js';

// Configuración de drops y precios
export const ITEMS = {
  // Minería
  'Piedra': { precio: 10, prob: 60, emoji: '🪨' },
  'Hierro': { precio: 50, prob: 30, emoji: '🪙' },
  'Oro': { precio: 200, prob: 8, emoji: '💰' },
  'Diamante': { precio: 1000, prob: 2, emoji: '💎' },
  // Pesca
  'Pez Común': { precio: 10, prob: 60, emoji: '🐟' },
  'Pez Globo': { precio: 50, prob: 30, emoji: '🐡' },
  'Pez Dorado': { precio: 200, prob: 8, emoji: '🐠' },
  'Kraken': { precio: 1000, prob: 2, emoji: '🦑' },
  // Agricultura
  'Trigo': { precio: 10, prob: 60, emoji: '🌾' },
  'Zanahoria': { precio: 50, prob: 30, emoji: '🥕' },
  'Sandía': { precio: 200, prob: 8, emoji: '🍉' },
  'Fruta Estrella': { precio: 1000, prob: 2, emoji: '⭐' },
};

const TABLAS_LOOT = {
  minar: ['Piedra', 'Hierro', 'Oro', 'Diamante'],
  pescar: ['Pez Común', 'Pez Globo', 'Pez Dorado', 'Kraken'],
  farmear: ['Trigo', 'Zanahoria', 'Sandía', 'Fruta Estrella']
};

function tirarLoot(tipo) {
  const prob = Math.random() * 100;
  const items = TABLAS_LOOT[tipo];
  
  let acumulado = 0;
  for (const item of items) {
    acumulado += ITEMS[item].prob;
    if (prob <= acumulado) return item;
  }
  return items[0]; // fallback
}

export function handleJob(interaction, jobType) {
  const userId = interaction.user.id;
  const cooldownSegundos = 5 * 60; // 5 minutos de cooldown
  
  const faltan = db_cooldowns.tiempoFaltante(userId, jobType, cooldownSegundos);
  if (faltan > 0) {
    const min = Math.floor(faltan / 60);
    const sec = faltan % 60;
    return interaction.reply({ content: `⏳ Estás muy cansado para ${jobType}. Espera **${min}m ${sec}s**.`, ephemeral: true });
  }

  // Hacer el trabajo
  db_cooldowns.actualizar(userId, jobType);
  const loot = tirarLoot(jobType);
  db_recursos.agregar(userId, loot, 1);

  // Mensaje
  const info = ITEMS[loot];
  let accionTxt = '';
  if (jobType === 'minar') accionTxt = 'Picaste la roca y encontraste';
  if (jobType === 'pescar') accionTxt = 'Lanzaste la caña y atrapaste';
  if (jobType === 'farmear') accionTxt = 'Cosechaste la tierra y obtuviste';

  let rarezaTxt = info.precio >= 200 ? '¡Qué suerte! ✨' : '';
  if (info.precio >= 1000) rarezaTxt = '¡¡INCREÍBLE SUERTE LEYENDA!! 🔥🔥🔥';

  return interaction.reply(`${info.emoji} **${accionTxt} 1x ${loot}**. ${rarezaTxt}\n*(Usa \`/vender\` para conseguir Monedas)*`);
}

export function handleVender(interaction) {
  const userId = interaction.user.id;
  const recursos = db_recursos.obtenerTodos(userId);
  
  if (recursos.length === 0) {
    return interaction.reply({ content: 'No tienes recursos para vender.', ephemeral: true });
  }

  let totalGanado = 0;
  let resumen = '';

  for (const rec of recursos) {
    const itemInfo = ITEMS[rec.item_id];
    if (itemInfo) {
      const ganancia = rec.cantidad * itemInfo.precio;
      totalGanado += ganancia;
      resumen += `${itemInfo.emoji} ${rec.cantidad}x ${rec.item_id} -> **${ganancia}** Monedas\n`;
      // Restar el inventario
      db_recursos.gastar(userId, rec.item_id, rec.cantidad);
    }
  }

  if (totalGanado > 0) {
    db_economia.agregarMonedas(userId, totalGanado);
    return interaction.reply(`🛒 **Vendiste todos tus recursos:**\n${resumen}\n💰 **Total Ganado: ${totalGanado} Monedas!**`);
  } else {
    return interaction.reply({ content: 'No pudiste vender nada.', ephemeral: true });
  }
}
