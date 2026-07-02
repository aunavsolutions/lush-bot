# Lush Bot 🐱🐟

> *Bot oficial de la familia Lush — Audition Latino*

---

## Qué hace

- **Aprende** de la familia automáticamente (frases, lore, momentos)
- **Detecta** palabras clave y reacciona con contexto
- **Aparece solo** cada cierto tiempo con algo de la familia
- **Responde** cuando lo mencionan o cuando tiene algo que aportar
- **Nunca spamea** — tiene cooldowns y criterio
- **Sistema de niveles** — XP por chatear, con títulos de Audition
- **Minijuegos** — minar, pescar, farmear y vender
- **Eventos temáticos** — combo challenges, trivias, outfits del día
- **Música** — reproduce canciones en canales de voz

---

## Setup rápido (3 pasos)

### 1. Crear el bot en Discord

1. Ve a [discord.com/developers/applications](https://discord.com/developers/applications)
2. **New Application** → ponle nombre (ej: Lush Bot)
3. Sección **Bot** → **Add Bot** → copia el **Token**
4. En **Bot**, activa:
   - ✅ `MESSAGE CONTENT INTENT`
   - ✅ `SERVER MEMBERS INTENT`
   - ✅ `PRESENCE INTENT`
5. Sección **OAuth2 → URL Generator**:
   - Scopes: `bot`, `applications.commands`
   - Permisos: `Send Messages`, `Read Message History`, `View Channels`, `Manage Roles`
   - Copia la URL generada y úsala para invitar el bot al servidor

### 2. Configurar el proyecto

```bash
cd squad-bot

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
```

Abre `.env` y completa:

```env
DISCORD_TOKEN=tu_token_del_bot
DISCORD_CLIENT_ID=id_de_tu_aplicacion
GEMINI_API_KEY=tu_api_key_de_gemini
BOT_NAME=Lush Bot
```

> La API key de Gemini la consigues en [aistudio.google.com](https://aistudio.google.com/app/apikey)

### 3. Registrar comandos e iniciar

```bash
# Registrar slash commands (solo una vez)
node src/deploy-commands.js

# Iniciar el bot
npm start

# O en modo dev (se reinicia solo con cambios)
npm run dev
```

---

## Canales de memoria

Crea estos canales en tu Discord para que el bot aprenda automáticamente:

| Canal | Qué guardar |
|-------|-------------|
| `#lore-del-squad` | Historias, momentos épicos, anécdotas |
| `#frases-del-squad` | Frases típicas, citas internas |
| `#memes-del-squad` | Memes con descripción |
| `#audios-del-squad` | Clips, referencias a audios |
| `#highlights` | Capturas y clips épicos de Audition |

---

## Comandos

### Memoria
| Comando | Qué hace |
|---------|----------|
| `/recuerdo` | El bot saca algo random de la familia |
| `/frase [texto]` | Guarda una frase manualmente |
| `/lore [historia]` | Guarda un momento de la familia |
| `/trigger [palabra]` | Agrega palabra que activa al bot |
| `/stats` | Cuánto sabe el bot |
| `/preguntar [pregunta]` | Preguntarle algo directamente |
| `/personalidad [desc]` | Configura cómo se comporta (solo admins) |

### Perfil y Economía
| Comando | Qué hace |
|---------|----------|
| `/perfil` | Tu tarjeta con nivel, título y monedas |
| `/top` | Ranking de la familia (por XP o monedas) |
| `/trabajar` | Gana monedas (cooldown: 1h) |
| `/minar` | Ve a la mina (cooldown: 5min) |
| `/pescar` | Lanza la caña (cooldown: 5min) |
| `/farmear` | Cosecha (cooldown: 5min) |
| `/vender` | Vende todos tus recursos |

### Audition / Familia
| Comando | Qué hace |
|---------|----------|
| `/outfit` | Genera una idea de outfit random |
| `/duo [@usuario]` | Simula una partida de Audition |

### Entretenimiento
| Comando | Qué hace |
|---------|----------|
| `/recomendar [tipo]` | Recomendación de anime/manga/manhwa |
| `/resena [título]` | Reseña sin spoilers |

### Música
| Comando | Qué hace |
|---------|----------|
| `/play [canción]` | Reproduce música |
| `/skip` | Salta canción |
| `/stop` | Detiene la música |

---

## Sistema de Niveles

| Nivel | Título |
|-------|--------|
| 1 | Novato del Beat |
| 5 | Bailarín Casual |
| 10 | Combo Breaker |
| 15 | Freestyler |
| 20 | Máquina de BPM |
| 25 | Leyenda del Dance Floor |
| 30 | Ícono Lush |

---

## Estructura del proyecto

```
squad-bot/
├── src/
│   ├── index.js              # Entrada principal
│   ├── deploy-commands.js    # Registrar slash commands
│   ├── levels.js             # Sistema de niveles/XP
│   ├── welcome.js            # Bienvenida a nuevos miembros
│   ├── roleplay.js           # GIFs con *acciones*
│   ├── jobs.js               # Minar, pescar, farmear
│   ├── events/
│   │   ├── messageCreate.js  # Lógica de mensajes + XP
│   │   └── randomEvents.js   # Eventos espontáneos
│   ├── commands/
│   │   └── index.js          # Slash commands
│   └── memory/
│       ├── database.js       # SQLite (memoria persistente)
│       └── brain.js          # Integración con Gemini
├── data/
│   └── squad.db              # Base de datos (se crea automáticamente)
├── .env.example
└── package.json
```

---

## Requisitos

- Node.js 18+
- API key de [Google AI Studio](https://aistudio.google.com) (Gemini)
- Bot de Discord creado en [Developer Portal](https://discord.com/developers)

---

*Lush Bot — un miembro más de la familia. 🐱🐟*
