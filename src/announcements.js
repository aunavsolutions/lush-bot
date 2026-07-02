// src/announcements.js
// Embeds de anuncios para canales del server — Lush Family

import { EmbedBuilder } from 'discord.js';

const ANUNCIOS = {
  principal: () => new EmbedBuilder()
    .setTitle('🐟 Bienvenidos a Lush Family 🐟')
    .setColor('#FF6B35')
    .setDescription(
      '¡La familia más unida de **Audition Latino**! 🎮💃\n\n' +
      'Este es tu hogar para compartir, jugar y crecer juntos.\n' +
      'Aquí encontrarás de todo:'
    )
    .addFields(
      { name: '🎮 Minijuegos', value: 'PPT, duelos, 8ball, ship y más', inline: true },
      { name: '🎰 Casino', value: 'Slots, blackjack, ruleta, dados', inline: true },
      { name: '💼 Economía', value: 'Mina, pesca, farmeo y trabajos', inline: true },
      { name: '🛒 Tienda', value: 'Roles de color, títulos, XP boosts', inline: true },
      { name: '📊 Niveles', value: 'Sube de rango chateando', inline: true },
      { name: '🧠 Lush Bot', value: 'IA, memoria, recuerdos', inline: true },
    )
    .addFields({
      name: '📌 Canales importantes',
      value:
        '> 📜 **#reglas** — Lee antes de participar\n' +
        '> 🎨 **#elige-tu-rol** — Personaliza tu perfil\n' +
        '> 💼 **#economía** — Trabaja y gana monedas\n' +
        '> 🎰 **#casino** — Apuesta tus monedas\n' +
        '> 🎮 **#minijuegos** — Juega con la familia',
      inline: false,
    })
    .addFields({
      name: '\u200b',
      value: '**Escribe `/guia` para ver todos los comandos del bot.**\n🐱🐟 *— Richelieu & æther*',
      inline: false,
    })
    .setFooter({ text: 'Lush Family • Audition Latino' })
    .setTimestamp(),

  roles: () => new EmbedBuilder()
    .setTitle('🎨 Elige tu Rol')
    .setColor('#A855F7')
    .setDescription(
      'Personaliza tu experiencia en el server.\n' +
      'Reacciona o usa los botones para elegir tus roles.\n\n' +
      '**¿Cómo funciona?**\n' +
      '> Elige los roles que te representen.\n' +
      '> Puedes tener varios al mismo tiempo.\n' +
      '> Los roles de color se compran en `/tienda`.'
    )
    .addFields(
      {
        name: '🎮 ¿Qué juegas?',
        value: '🕹️ Audition Latino\n🎯 Valorant\n🏗️ Roblox\n🎮 Otros',
        inline: true,
      },
      {
        name: '🌍 Región',
        value: '🇲🇽 México\n🇨🇴 Colombia\n🇦🇷 Argentina\n🇨🇱 Chile\n🌎 Otro',
        inline: true,
      },
      {
        name: '🔔 Notificaciones',
        value: '📢 Anuncios\n🎮 Eventos\n🎰 Torneos\n📺 Streams',
        inline: true,
      },
    )
    .addFields({
      name: '🎨 Roles de Color (Tienda)',
      value: '> Compra roles de color con tus monedas usando `/tienda`\n> 🔴🔵🟢🟣🩷🟡🌈 — Desde **500 monedas**',
      inline: false,
    })
    .setFooter({ text: 'Los roles de color se compran en /tienda con monedas' }),

  memes: () => new EmbedBuilder()
    .setTitle('😂 Canal de Memes')
    .setColor('#FBBF24')
    .setDescription(
      'Comparte los mejores memes con la familia. 🐟\n\n' +
      '**Reglas del canal:**'
    )
    .addFields(
      { name: '✅ Permitido', value: '• Memes de Audition, gaming, anime\n• Memes en español/inglés\n• Videos cortos graciosos\n• Stickers y GIFs', inline: true },
      { name: '❌ Prohibido', value: '• NSFW o gore\n• Memes ofensivos/racistas\n• Spam del mismo meme\n• Publicidad disfrazada', inline: true },
    )
    .addFields({
      name: '💡 Tips',
      value: '> 🏆 Los mejores memes ganan reacciones y **monedas** del bot\n> 📌 Si es muy bueno, un admin lo puede pinear',
      inline: false,
    })
    .setFooter({ text: 'Lush Family • ¡Haz reír a la familia! 😹' }),

  capturas: () => new EmbedBuilder()
    .setTitle('📸 Capturas & Momentos')
    .setColor('#3B82F6')
    .setDescription(
      'Comparte tus mejores momentos de juego. 🎮✨\n\n' +
      '**¿Qué publicar aquí?**'
    )
    .addFields(
      { name: '🎮 Gaming', value: '• Outfits de Audition\n• Scores épicos\n• Jugadas clutch\n• Logros desbloqueados', inline: true },
      { name: '🐟 Familia', value: '• Momentos con la fam\n• Screenshots del server\n• Chats graciosos\n• Antes y después', inline: true },
    )
    .addFields({
      name: '📏 Formato recomendado',
      value: '> Sube la imagen directamente (no links externos)\n> Agrega contexto a tu captura\n> Usa `/lore` para guardar momentos épicos en la memoria del bot',
      inline: false,
    })
    .setFooter({ text: 'Lush Family • ¡Comparte tu historia! 📸' }),

  offtopic: () => new EmbedBuilder()
    .setTitle('💬 Off-Topic')
    .setColor('#6B7280')
    .setDescription(
      'El lugar para hablar de lo que sea. 🗣️\n' +
      'No tiene que ser sobre gaming — ¡sé tú mismo!\n\n' +
      '**Temas populares:**'
    )
    .addFields(
      { name: '🎵', value: 'Música', inline: true },
      { name: '🍿', value: 'Películas / Series', inline: true },
      { name: '📱', value: 'Tech', inline: true },
      { name: '🍕', value: 'Comida', inline: true },
      { name: '📚', value: 'Anime / Manga', inline: true },
      { name: '💭', value: 'Random', inline: true },
    )
    .addFields({
      name: '⚠️ Recuerda',
      value: '> Mantén el respeto siempre\n> Sin temas políticos o religiosos controversiales\n> Si se pone intenso, respira y tómalo con calma 🧊',
      inline: false,
    })
    .setFooter({ text: 'Lush Family • Tu espacio libre 💬' }),

  minijuegos: () => new EmbedBuilder()
    .setTitle('🎮 Canal de Minijuegos')
    .setColor('#22C55E')
    .setDescription(
      '¡Diviértete con los juegos del bot! 🐟\n' +
      'Usa estos comandos aquí para jugar con la familia:\n'
    )
    .addFields(
      { name: '✊ /ppt', value: 'Piedra, Papel o Tijeras\nvs el bot', inline: true },
      { name: '🎱 /8ball <pregunta>', value: 'La bola mágica\nte responde', inline: true },
      { name: '🔢 /adivina <1-10>', value: 'Adivina el número\nsecreto', inline: true },
      { name: '💕 /ship @a @b', value: 'Compatibilidad %\nentre dos personas', inline: true },
      { name: '⚔️ /duelo @user', value: 'Reta a alguien a\nun duelo épico', inline: true },
      { name: '🎯 /duo', value: 'Simula una partida\nde Audition', inline: true },
    )
    .addFields({
      name: '🎰 ¿Quieres apostar?',
      value: '> Los juegos de **casino** van en el canal `#casino`\n> `/slots` `/blackjack` `/ruleta` `/coinflip` `/dados`',
      inline: false,
    })
    .setFooter({ text: 'Lush Family • ¡Juega limpio y diviértete! 🎮' }),

  economia: () => new EmbedBuilder()
    .setTitle('💼 Economía Lush — Cómo ganar monedas')
    .setColor('#F59E0B')
    .setDescription('Las monedas 💰 son la moneda del server. Úsalas en la tienda y el casino.')
    .addFields(
      {
        name: '⛏️ /minar',
        value: '> 🪨 Piedra (10💰) • 🪙 Hierro (25💰)\n> 💰 Oro (50💰) • 💎 **Diamante (1,000💰)**\n> ⏳ Cooldown: 5 min',
        inline: false,
      },
      {
        name: '🎣 /pescar',
        value: '> 🐟 Pez (10💰) • 🐡 Globo (25💰)\n> 🐠 Dorado (50💰) • 🦑 **Kraken (1,000💰)**\n> ⏳ Cooldown: 5 min',
        inline: false,
      },
      {
        name: '🌾 /farmear',
        value: '> 🌾 Trigo (10💰) • 🥕 Zanahoria (25💰)\n> 🍉 Sandía (50💰) • ⭐ **Fruta Estelar (1,000💰)**\n> ⏳ Cooldown: 5 min',
        inline: false,
      },
      {
        name: '💰 /trabajar',
        value: '> Gana entre **50-200 monedas** al azar\n> ⏳ Cooldown: 30 min',
        inline: false,
      },
      {
        name: '📦 /vender',
        value: '> Vende **todos** tus recursos de una vez\n> Los items raros valen más',
        inline: false,
      },
    )
    .addFields({
      name: '🛒 ¿En qué gastarlas?',
      value:
        '> `/tienda` — Roles de color, títulos, XP boosts\n' +
        '> `/slots` `/blackjack` `/ruleta` — Casino\n' +
        '> `/comprar loteria` — Chance de ganar **10,000💰**',
      inline: false,
    })
    .setFooter({ text: 'Lush Family • ¡Hazte rico! 💰' }),

  banco: () => new EmbedBuilder()
    .setTitle('🏦 Banco Lush')
    .setColor('#2563EB')
    .setDescription(
      'Tu dinero en la billetera es **vulnerable a robos**.\n' +
      'Deposita en el banco para protegerlo y ganar **interés diario**.\n'
    )
    .addFields(
      { name: '📥 /depositar <cantidad>', value: 'Guarda monedas en el banco\n🔒 Seguras contra `/robar`', inline: true },
      { name: '📤 /retirar <cantidad>', value: 'Saca monedas del banco\na tu billetera', inline: true },
      { name: '💰 /saldo', value: 'Ve tu billetera vs banco\ncon barra visual', inline: true },
      { name: '💸 /transferir @user', value: 'Envía monedas a otro\nmiembro de la familia', inline: true },
      { name: '🦹 /robar @user', value: 'Intenta robar de la\nbilletera de alguien', inline: true },
      { name: '📈 Interés Diario', value: '2% sobre tu depósito\n(máx. 5,000/día)', inline: true },
    )
    .addFields({
      name: '🦹 ¿Cómo funciona /robar?',
      value:
        '> 🟢 **40%** de éxito → robas 10-30% de su billetera\n' +
        '> ⚪ **30%** de fallo → no pasa nada\n' +
        '> 🔴 **30%** te atrapan → pagas multa de 10-20% de TU billetera\n' +
        '> ⏳ Cooldown: 30 minutos',
      inline: false,
    })
    .addFields({
      name: '💡 Consejo',
      value: '> Deposita tus monedas después de trabajar para que nadie te las robe.\n> El dinero en el banco **no se puede robar** y genera interés. 🏦',
      inline: false,
    })
    .setFooter({ text: 'Lush Family • Protege tus monedas 🔒' }),

  casino: () => new EmbedBuilder()
    .setTitle('🎰 Casino Lush — ¡Apuesta y Gana!')
    .setColor('#EF4444')
    .setDescription(
      'Bienvenido al casino de la familia. 🐟\n' +
      'Aquí puedes apostar tus monedas en 5 juegos diferentes.\n' +
      '**Apuesta mínima: 10💰 • Máxima: 50,000💰**'
    )
    .addFields(
      {
        name: '🎰 /slots <apuesta>',
        value:
          '> Tira la tragamonedas con 7 símbolos\n' +
          '> 🍒 x1 • 🍋 x1.5 • 🍊 x2 • 🍇 x3\n' +
          '> 🐟 x5 • 💎 x7 • 7️⃣ **x10 JACKPOT**\n' +
          '> Par = recuperas 50%',
        inline: false,
      },
      {
        name: '🃏 /blackjack <apuesta>',
        value:
          '> Juego de cartas interactivo con botones\n' +
          '> 🃏 **Pedir** — Otra carta\n' +
          '> ✋ **Plantarse** — Quedarte con lo que tienes\n' +
          '> Blackjack natural = **x2.5** • Ganar = **x2**',
        inline: false,
      },
      {
        name: '🎡 /ruleta <apuesta> <color>',
        value:
          '> 🔴 **Rojo** — Paga x2 (48.6%)\n' +
          '> ⚫ **Negro** — Paga x2 (48.6%)\n' +
          '> 🟢 **Verde** — Paga **x14** (2.7%)',
        inline: false,
      },
      {
        name: '🪙 /coinflip <apuesta> <cara|cruz>',
        value:
          '> 50/50 — Doble o nada\n' +
          '> Elige 🪙 Cara o 💀 Cruz',
        inline: true,
      },
      {
        name: '🎲 /dados <apuesta>',
        value:
          '> Tira 2 dados vs el bot\n' +
          '> Mayor suma gana • Empate = devuelve',
        inline: true,
      },
    )
    .addFields({
      name: '⚠️ Consejos',
      value:
        '> 🏦 Deposita tus ganancias en `/depositar` para protegerlas\n' +
        '> 🦹 Si dejas mucho en la billetera, alguien puede usar `/robar`\n' +
        '> 🎰 La lotería de la tienda (`/comprar loteria`) también está buena',
      inline: false,
    })
    .setFooter({ text: 'Lush Family • ¡Juega responsablemente! 🎲' }),

  reglas: () => new EmbedBuilder()
    .setTitle('📜 Reglas del Servidor')
    .setColor('#E11D48')
    .setDescription('Para mantener la armonía en la familia Lush, respeta las siguientes reglas. El incumplimiento resultará en mute, warn o ban.')
    .addFields(
      { name: '1️⃣ Respeto ante todo', value: 'Trata a todos con respeto. Cero toxicidad, insultos o discriminación.' },
      { name: '2️⃣ Sin spam ni flood', value: 'No envíes mensajes repetitivos, exceso de emojis o publicidad.' },
      { name: '3️⃣ Contenido apropiado', value: 'Prohibido contenido NSFW, gore o excesivamente ofensivo.' },
      { name: '4️⃣ Usa los canales correctos', value: 'Mantén el orden: memes en su canal, música en música, etc.' },
      { name: '5️⃣ Economía justa', value: 'No abuses de bugs ni uses multicuentas para farmear monedas.' }
    )
    .setFooter({ text: 'Lush Family • El desconocimiento de las reglas no exime su cumplimiento' }),

  guias: () => new EmbedBuilder()
    .setTitle('📖 Guías y Tutoriales')
    .setColor('#3B82F6')
    .setDescription('Aquí encontrarás toda la información útil sobre el servidor y el juego.')
    .addFields(
      { name: '🤖 Comandos del bot', value: 'Escribe `/guia` en cualquier canal para ver todo lo que puede hacer el bot.' },
      { name: '💃 Audition Latino', value: 'Pronto publicaremos guías de modos de juego, misiones y parches.' }
    ),

  redes: () => new EmbedBuilder()
    .setTitle('🌍 Nuestras Redes Sociales')
    .setColor('#0EA5E9')
    .setDescription('¡Síguenos en nuestras redes para no perderte ningún evento o torneo de la familia!')
    .addFields(
      { name: '📘 Facebook', value: '[Grupo Oficial](https://facebook.com)' },
      { name: '📸 Instagram', value: '[@LushFam](https://instagram.com)' },
      { name: '📺 Twitch / YouTube', value: 'Directos de torneos y más.' }
    ),

  presentacion: () => new EmbedBuilder()
    .setTitle('👋 Preséntate a la familia')
    .setColor('#10B981')
    .setDescription('¡Queremos conocerte! Usa este formato para presentarte y que todos te demos la bienvenida:')
    .addFields({
      name: '📝 Formato de Presentación',
      value: '```\n👤 Nombre / Apodo:\n🎂 Edad:\n🌎 País:\n🎮 Nick en Audition:\n🎵 Modo favorito:\n```'
    }),

  confesiones: () => new EmbedBuilder()
    .setTitle('🤫 Confesiones Anónimas')
    .setColor('#8B5CF6')
    .setDescription('¿Tienes algo que decir pero no quieres revelar tu identidad? ¡Este es el lugar!')
    .addFields({
      name: '¿Cómo funciona?',
      value: '> Usa el comando `/confesion` en **cualquier canal**.\n> El bot enviará tu mensaje aquí de forma 100% anónima.\n> Nadie, ni los admins, sabrán quién lo escribió.'
    })
    .setFooter({ text: 'Lush Family • ¡Desahógate sin miedo!' }),

  libros: () => new EmbedBuilder()
    .setTitle('📚 Biblioteca Lush')
    .setColor('#D97706')
    .setDescription('Un espacio cultural. Compra y lee libros, guías o PDFs especiales.')
    .addFields(
      { name: '🛒 Comprar Libros', value: 'Usa `/tienda` y ve a la sección de Libros.' },
      { name: '➕ Añadir', value: 'Los admins pueden añadir material con `/tienda-add`.' }
    ),

  directorio: () => new EmbedBuilder()
    .setTitle('🗺️ Directorio de Canales')
    .setColor('#06B6D4')
    .setDescription('Aquí tienes una guía rápida de para qué sirve cada canal en el servidor:')
    .addFields(
      { name: '🔥 INICIO', value: '• **#bienvenidos:** Bienvenidas y registro (`/vincular`)\n• **#reglas:** Normas del servidor\n• **#autorol:** Elige tus roles y colores\n• **#anuncios:** Noticias y novedades\n• **#guias:** Información útil\n• **#presentacion:** Preséntate a la familia' },
      { name: '💬 CANALES DE TEXTO', value: '• **#general:** Chat principal\n• **#memes:** Comparte humor\n• **#confesiones:** Usa `/confesion` para publicar anónimamente' },
      { name: '🤖 BOT Y ENTRETENIMIENTO', value: '• **#banco:** Usa `/depositar`, `/robar`, `/saldo`\n• **#economia:** Trabaja, mina, pesca (`/trabajar`, `/minar`)\n• **#minijuegos:** Juega `/ppt`, `/duelo`, `/8ball`\n• **#casino:** Apuesta `/slots`, `/ruleta`' },
      { name: '🎮 VIDEOJUEGOS', value: '• **#sala-gamer:** Chat sobre juegos\n• **#capturas / #grabaciones:** Comparte tus mejores jugadas' }
    )
    .setFooter({ text: 'Lush Family • ¡Explora y diviértete!' }),
};

export function getAnuncio(tipo) {
  const builder = ANUNCIOS[tipo];
  return builder ? builder() : null;
}

export function getTiposDisponibles() {
  return Object.keys(ANUNCIOS);
}
