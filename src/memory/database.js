// src/memory/database.js
// La memoria del squad — todo lo que el bot aprende vive aquí

import Database from 'better-sqlite3';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { mkdirSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '../../data');

mkdirSync(DATA_DIR, { recursive: true });

const db = new Database(join(DATA_DIR, 'squad.db'));

// Optimizaciones de SQLite
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// ─── ESQUEMA ───────────────────────────────────────────────────────────────

db.exec(`
  -- Frases del squad (de #frases-del-squad o detectadas automáticamente)
  CREATE TABLE IF NOT EXISTS frases (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    texto       TEXT NOT NULL,
    autor       TEXT,
    canal       TEXT,
    guardada_en INTEGER DEFAULT (unixepoch()),
    veces_usada INTEGER DEFAULT 0
  );

  -- Lore del squad (de #lore-del-squad)
  CREATE TABLE IF NOT EXISTS lore (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    titulo      TEXT,
    contenido   TEXT NOT NULL,
    autor       TEXT,
    guardado_en INTEGER DEFAULT (unixepoch()),
    tags        TEXT DEFAULT ''
  );

  -- Palabras clave que activan al bot
  CREATE TABLE IF NOT EXISTS triggers (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    palabra     TEXT NOT NULL UNIQUE,
    respuesta   TEXT,
    tipo        TEXT DEFAULT 'frase', -- 'frase' | 'lore' | 'random' | 'claude'
    activo      INTEGER DEFAULT 1
  );

  -- Historial de respuestas (para no repetirse)
  CREATE TABLE IF NOT EXISTS historial (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    tipo        TEXT,
    referencia  INTEGER,
    canal_id    TEXT,
    timestamp   INTEGER DEFAULT (unixepoch())
  );

  -- Config por servidor
  CREATE TABLE IF NOT EXISTS config (
    guild_id    TEXT PRIMARY KEY,
    bot_name    TEXT DEFAULT 'El Bot',
    personalidad TEXT DEFAULT '',
    activo      INTEGER DEFAULT 1
  );

  -- Economía (Dinero/Experiencia por usuario)
  CREATE TABLE IF NOT EXISTS economia (
    user_id TEXT PRIMARY KEY,
    monedas INTEGER DEFAULT 0,
    experiencia INTEGER DEFAULT 0
  );

  -- Inventario de Recursos Genéricos (Minería, Pesca, Agricultura)
  CREATE TABLE IF NOT EXISTS inventario_recursos (
    user_id TEXT,
    item_id TEXT,
    cantidad INTEGER DEFAULT 0,
    PRIMARY KEY (user_id, item_id)
  );

  -- Cooldowns Genéricos
  CREATE TABLE IF NOT EXISTS cooldowns (
    user_id TEXT,
    comando TEXT,
    timestamp INTEGER,
    PRIMARY KEY (user_id, comando)
  );

  -- Nombres preferidos
  CREATE TABLE IF NOT EXISTS nombres (
    user_id TEXT PRIMARY KEY,
    nombre TEXT NOT NULL
  );

  -- Matrimonios
  CREATE TABLE IF NOT EXISTS matrimonios (
    user_id_1 TEXT NOT NULL,
    user_id_2 TEXT NOT NULL,
    fecha INTEGER DEFAULT (unixepoch()),
    PRIMARY KEY (user_id_1, user_id_2)
  );

  -- Memorias / Recuerdos del usuario
  CREATE TABLE IF NOT EXISTS memorias (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    tipo TEXT DEFAULT 'nota',
    contenido TEXT NOT NULL,
    creado_en INTEGER DEFAULT (unixepoch())
  );
`);

// Migración segura
try {
  db.exec(`ALTER TABLE economia ADD COLUMN ultimo_trabajo INTEGER DEFAULT 0;`);
} catch (e) {}

// ─── FRASES ────────────────────────────────────────────────────────────────

export const db_frases = {
  guardar(texto, autor, canal) {
    const stmt = db.prepare(`
      INSERT INTO frases (texto, autor, canal) VALUES (?, ?, ?)
    `);
    return stmt.run(texto, autor, canal);
  },

  obtenerRandom() {
    return db.prepare(`
      SELECT * FROM frases ORDER BY RANDOM() LIMIT 1
    `).get();
  },

  obtenerRecientes(limit = 10) {
    return db.prepare(`
      SELECT * FROM frases ORDER BY guardada_en DESC LIMIT ?
    `).all(limit);
  },

  buscar(query) {
    return db.prepare(`
      SELECT * FROM frases WHERE texto LIKE ? LIMIT 5
    `).all(`%${query}%`);
  },

  marcarUsada(id) {
    db.prepare(`UPDATE frases SET veces_usada = veces_usada + 1 WHERE id = ?`).run(id);
  },

  total() {
    return db.prepare(`SELECT COUNT(*) as n FROM frases`).get().n;
  }
};

// ─── LORE ──────────────────────────────────────────────────────────────────

export const db_lore = {
  guardar(contenido, autor, titulo = null, tags = '') {
    return db.prepare(`
      INSERT INTO lore (titulo, contenido, autor, tags) VALUES (?, ?, ?, ?)
    `).run(titulo, contenido, autor, tags);
  },

  obtenerRandom() {
    return db.prepare(`
      SELECT * FROM lore ORDER BY RANDOM() LIMIT 1
    `).get();
  },

  obtenerTodo(limit = 20) {
    return db.prepare(`
      SELECT * FROM lore ORDER BY guardado_en DESC LIMIT ?
    `).all(limit);
  },

  buscarPorTag(tag) {
    return db.prepare(`
      SELECT * FROM lore WHERE tags LIKE ? LIMIT 5
    `).all(`%${tag}%`);
  },

  total() {
    return db.prepare(`SELECT COUNT(*) as n FROM lore`).get().n;
  }
};

// ─── TRIGGERS ──────────────────────────────────────────────────────────────

export const db_triggers = {
  agregar(palabra, respuesta = null, tipo = 'claude') {
    return db.prepare(`
      INSERT OR REPLACE INTO triggers (palabra, respuesta, tipo) VALUES (?, ?, ?)
    `).run(palabra.toLowerCase(), respuesta, tipo);
  },

  obtenerTodos() {
    return db.prepare(`SELECT * FROM triggers WHERE activo = 1`).all();
  },

  detectar(texto) {
    const triggers = db_triggers.obtenerTodos();
    const textoLower = texto.toLowerCase();
    return triggers.filter(t => textoLower.includes(t.palabra));
  }
};

// ─── HISTORIAL ─────────────────────────────────────────────────────────────

export const db_historial = {
  registrar(tipo, referencia, canal_id) {
    db.prepare(`
      INSERT INTO historial (tipo, referencia, canal_id) VALUES (?, ?, ?)
    `).run(tipo, referencia, canal_id);
  },

  // Evitar spam: ¿respondió en este canal recientemente?
  respondioReciente(canal_id, segundos = 30) {
    const cutoff = Math.floor(Date.now() / 1000) - segundos;
    const row = db.prepare(`
      SELECT id FROM historial 
      WHERE canal_id = ? AND timestamp > ? 
      ORDER BY timestamp DESC LIMIT 1
    `).get(canal_id, cutoff);
    return !!row;
  }
};

// ─── CONFIG ────────────────────────────────────────────────────────────────

export const db_config = {
  obtener(guild_id) {
    let config = db.prepare(`SELECT * FROM config WHERE guild_id = ?`).get(guild_id);
    if (!config) {
      db.prepare(`INSERT INTO config (guild_id) VALUES (?)`).run(guild_id);
      config = db.prepare(`SELECT * FROM config WHERE guild_id = ?`).get(guild_id);
    }
    return config;
  },

  actualizar(guild_id, campo, valor) {
    db.prepare(`UPDATE config SET ${campo} = ? WHERE guild_id = ?`).run(valor, guild_id);
  }
};

// ─── ECONOMÍA ──────────────────────────────────────────────────────────────

export const db_economia = {
  obtener(user_id) {
    let perfil = db.prepare(`SELECT * FROM economia WHERE user_id = ?`).get(user_id);
    if (!perfil) {
      db.prepare(`INSERT INTO economia (user_id) VALUES (?)`).run(user_id);
      perfil = db.prepare(`SELECT * FROM economia WHERE user_id = ?`).get(user_id);
    }
    return perfil;
  },

  agregarMonedas(user_id, cantidad) {
    this.obtener(user_id); // asegurar que existe
    db.prepare(`UPDATE economia SET monedas = monedas + ? WHERE user_id = ?`).run(cantidad, user_id);
  },

  agregarExp(user_id, cantidad) {
    this.obtener(user_id);
    db.prepare(`UPDATE economia SET experiencia = experiencia + ? WHERE user_id = ?`).run(cantidad, user_id);
  },

  actualizarTrabajo(user_id) {
    this.obtener(user_id);
    db.prepare(`UPDATE economia SET ultimo_trabajo = (unixepoch()) WHERE user_id = ?`).run(user_id);
  }
};



// ─── RECURSOS (Genérico) ───────────────────────────────────────────────────

export const db_recursos = {
  obtener(user_id, item_id) {
    const row = db.prepare(`SELECT cantidad FROM inventario_recursos WHERE user_id = ? AND item_id = ?`).get(user_id, item_id);
    return row ? row.cantidad : 0;
  },

  obtenerTodos(user_id) {
    return db.prepare(`SELECT item_id, cantidad FROM inventario_recursos WHERE user_id = ? AND cantidad > 0`).all(user_id);
  },

  agregar(user_id, item_id, cantidad) {
    db.prepare(`
      INSERT INTO inventario_recursos (user_id, item_id, cantidad) 
      VALUES (?, ?, ?) 
      ON CONFLICT(user_id, item_id) DO UPDATE SET cantidad = cantidad + ?
    `).run(user_id, item_id, cantidad, cantidad);
  },

  gastar(user_id, item_id, cantidad) {
    const actual = this.obtener(user_id, item_id);
    if (actual < cantidad) return false;
    db.prepare(`UPDATE inventario_recursos SET cantidad = cantidad - ? WHERE user_id = ? AND item_id = ?`).run(cantidad, user_id, item_id);
    return true;
  }
};

// ─── COOLDOWNS ─────────────────────────────────────────────────────────────

export const db_cooldowns = {
  // Retorna los segundos que faltan, o 0 si ya puede usarlo
  tiempoFaltante(user_id, comando, cooldownSegundos) {
    const row = db.prepare(`SELECT timestamp FROM cooldowns WHERE user_id = ? AND comando = ?`).get(user_id, comando);
    if (!row) return 0;
    
    const ahora = Math.floor(Date.now() / 1000);
    const pasado = ahora - row.timestamp;
    return pasado >= cooldownSegundos ? 0 : cooldownSegundos - pasado;
  },

  actualizar(user_id, comando) {
    const ahora = Math.floor(Date.now() / 1000);
    db.prepare(`
      INSERT INTO cooldowns (user_id, comando, timestamp) 
      VALUES (?, ?, ?) 
      ON CONFLICT(user_id, comando) DO UPDATE SET timestamp = ?
    `).run(user_id, comando, ahora, ahora);
  }
};

// ─── NOMBRES PREFERIDOS ────────────────────────────────────────────────────

export const db_nombres = {
  guardar(user_id, nombre) {
    db.prepare(`
      INSERT INTO nombres (user_id, nombre) 
      VALUES (?, ?) 
      ON CONFLICT(user_id) DO UPDATE SET nombre = ?
    `).run(user_id, nombre, nombre);
  },

  obtener(user_id) {
    const row = db.prepare(`SELECT nombre FROM nombres WHERE user_id = ?`).get(user_id);
    return row ? row.nombre : null;
  }
};

// ─── MATRIMONIOS ───────────────────────────────────────────────────────────

export const db_matrimonios = {
  proponer(user_id_1, user_id_2) {
    // Ordenar los IDs alfabéticamente para que (A, B) y (B, A) sean la misma pareja
    const [u1, u2] = [user_id_1, user_id_2].sort();
    
    // Verificar si alguno ya está casado
    if (this.obtenerPareja(u1) || this.obtenerPareja(u2)) {
      return false;
    }
    
    db.prepare(`
      INSERT INTO matrimonios (user_id_1, user_id_2) VALUES (?, ?)
    `).run(u1, u2);
    return true;
  },

  obtenerPareja(user_id) {
    const row = db.prepare(`
      SELECT user_id_1, user_id_2, fecha FROM matrimonios 
      WHERE user_id_1 = ? OR user_id_2 = ?
    `).get(user_id, user_id);
    
    if (!row) return null;
    return {
      pareja_id: row.user_id_1 === user_id ? row.user_id_2 : row.user_id_1,
      fecha: row.fecha
    };
  },

  divorciar(user_id) {
    const pareja = this.obtenerPareja(user_id);
    if (!pareja) return false;
    
    db.prepare(`
      DELETE FROM matrimonios 
      WHERE (user_id_1 = ? AND user_id_2 = ?) OR (user_id_1 = ? AND user_id_2 = ?)
    `).run(user_id, pareja.pareja_id, pareja.pareja_id, user_id);
    return true;
  }
};

// ─── MEMORIAS / RECUERDOS ──────────────────────────────────────────────────
export const db_memorias = {
  guardar(user_id, contenido, tipo = 'nota') {
    return db.prepare(`
      INSERT INTO memorias (user_id, contenido, tipo) VALUES (?, ?, ?)
    `).run(user_id, contenido, tipo);
  },

  obtenerTodas(user_id) {
    return db.prepare(`
      SELECT * FROM memorias WHERE user_id = ? ORDER BY creado_en DESC
    `).all(user_id);
  },

  eliminarTodas(user_id) {
    return db.prepare(`
      DELETE FROM memorias WHERE user_id = ?
    `).run(user_id);
  }
};

export default db;
