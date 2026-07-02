// src/levels.js
// Sistema de niveles — progresión dentro de la familia Lush

import { EmbedBuilder } from 'discord.js';
import { db_economia } from './memory/database.js';
import { getXpMultiplier, getTituloCustom } from './shop.js';

// ═══════════════════════════════════════════════════════════════
// 🎯 TÍTULOS DE NIVEL — Progresión en la comunidad
// ═══════════════════════════════════════════════════════════════

const TITLES = [
  { level: 1,  title: 'Recién Llegad@',              xp: 0 },
  { level: 5,  title: 'Conocid@ del Server',          xp: 500 },
  { level: 10, title: 'Habitante Fijo',                xp: 2000 },
  { level: 15, title: 'De Confianza',                  xp: 5000 },
  { level: 20, title: 'Pilar de la Familia',           xp: 10000 },
  { level: 25, title: 'Leyenda del Chat',              xp: 20000 },
  { level: 30, title: 'Ícono Lush',                    xp: 40000 },
];

// XP necesaria para un nivel dado
export function xpParaNivel(level) {
  // Fórmula: 100 * level^1.5
  return Math.floor(100 * Math.pow(level, 1.5));
}

// Calcular el nivel actual basado en XP total
export function calcularNivel(xpTotal) {
  let nivel = 1;
  while (xpParaNivel(nivel + 1) <= xpTotal) {
    nivel++;
  }
  return nivel;
}

// Obtener el título correspondiente al nivel
export function obtenerTitulo(nivel) {
  let titulo = TITLES[0].title;
  for (const t of TITLES) {
    if (nivel >= t.level) {
      titulo = t.title;
    }
  }
  return titulo;
}

// Agregar XP y verificar si subió de nivel
export function agregarXP(userId, cantidad) {
  const antes = db_economia.obtener(userId);
  const nivelAntes = calcularNivel(antes.experiencia);

  // Aplicar XP Boost de la tienda
  const multiplicador = getXpMultiplier(userId);
  const xpFinal = Math.floor(cantidad * multiplicador);
  db_economia.agregarExp(userId, xpFinal);

  const despues = db_economia.obtener(userId);
  const nivelDespues = calcularNivel(despues.experiencia);

  return {
    subioDeNivel: nivelDespues > nivelAntes,
    nivelAnterior: nivelAntes,
    nivelNuevo: nivelDespues,
    tituloNuevo: obtenerTitulo(nivelDespues),
    xpTotal: despues.experiencia,
    xpSiguiente: xpParaNivel(nivelDespues + 1),
  };
}

// Generar embed de subida de nivel
export function embedNivelUp(username, data) {
  const progreso = Math.floor((data.xpTotal / data.xpSiguiente) * 20);
  const barra = '█'.repeat(progreso) + '░'.repeat(20 - progreso);

  return new EmbedBuilder()
    .setTitle('🎉 ¡Subida de Nivel!')
    .setDescription(
      `**${username}** subió al nivel **${data.nivelNuevo}**!\n\n` +
      `🏷️ Nuevo título: **${data.tituloNuevo}**\n` +
      `📊 \`[${barra}]\` ${data.xpTotal}/${data.xpSiguiente} XP`
    )
    .setColor('#FFD700')
    .setTimestamp();
}

// Generar embed de perfil de nivel
export function embedPerfil(user, monedas) {
  const perfil = db_economia.obtener(user.id);
  const nivel = calcularNivel(perfil.experiencia);
  const titulo = obtenerTitulo(nivel);
  const xpSig = xpParaNivel(nivel + 1);
  const progreso = Math.floor((perfil.experiencia / xpSig) * 20);
  const barra = '█'.repeat(Math.min(progreso, 20)) + '░'.repeat(Math.max(20 - progreso, 0));

  return new EmbedBuilder()
    .setTitle(`Perfil de ${user.username}`)
    .setThumbnail(user.displayAvatarURL({ dynamic: true }))
    .setColor('#9B59B6')
    .addFields(
      { name: '🏷️ Título', value: getTituloCustom(user.id) || titulo, inline: true },
      { name: '📊 Nivel', value: `${nivel}`, inline: true },
      { name: '💰 Monedas', value: `${perfil.monedas}`, inline: true },
      { name: '✨ Experiencia', value: `\`[${barra}]\`\n${perfil.experiencia}/${xpSig} XP`, inline: false },
    )
    .setTimestamp();
}

// Top/Leaderboard
export function getLeaderboard(guild) {
  // Esto necesita acceso directo a la DB — se maneja desde commands
  return null;
}
