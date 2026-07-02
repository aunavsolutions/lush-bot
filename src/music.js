// src/music.js
// Música deshabilitada — se recomienda usar un bot dedicado (Jockie Music, etc.)

export async function initMusic() {
  console.log('🎵 Música: Deshabilitada (usar bot dedicado)');
}

export async function playMusic() {
  throw new Error('La música está deshabilitada. Usa un bot dedicado como Jockie Music o Hydra.');
}

export function skipTrack() { return false; }
export function stopMusic() { return false; }
export function isPlaying() { return false; }
