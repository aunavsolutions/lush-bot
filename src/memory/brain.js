// src/memory/brain.js
// El cerebro del bot — usa Gemini para generar respuestas con personalidad Lush

import { GoogleGenerativeAI } from '@google/generative-ai';
import { db_frases, db_lore, db_nombres, db_memorias } from './database.js';

// Helper de rotación de claves
const getApiKeys = () => {
  return (process.env.GEMINI_API_KEY || '').split(',').map(k => k.trim()).filter(Boolean);
};

async function ejecutarConRotacion(action) {
  const keys = getApiKeys();
  if (keys.length === 0) {
    throw new Error('No se configuraron API Keys de Gemini.');
  }

  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    try {
      const genAI = new GoogleGenerativeAI(key);
      return await action(genAI);
    } catch (error) {
      console.error(`[Brain] Error con API Key #${i + 1}:`, error.message);
      if (i === keys.length - 1) {
        throw error; // Se agotaron los reintentos
      }
      console.log(`[Brain] Rotando a la siguiente API Key...`);
    }
  }
}

// Construye el contexto del squad para que Gemini lo entienda
function buildSquadContext() {
  const frases = db_frases.obtenerRecientes(15);
  const lore = db_lore.obtenerTodo(10);

  let contexto = '';

  if (frases.length > 0) {
    contexto += '\n\nFRASES TÍPICAS DE LA FAMILIA:\n';
    frases.forEach(f => {
      contexto += `- "${f.texto}"${f.autor ? ` (${f.autor})` : ''}\n`;
    });
  }

  if (lore.length > 0) {
    contexto += '\n\nMOMENTOS / LORE DE LA FAMILIA:\n';
    lore.forEach(l => {
      contexto += `- ${l.titulo ? `[${l.titulo}] ` : ''}${l.contenido}\n`;
    });
  }

  return contexto;
}

// Sistema de personalidad base
function getSystemPrompt(guildConfig = {}, userId = null, discordName = '') {
  const nombreBot = guildConfig.bot_name || process.env.BOT_NAME || 'Lush Bot';
  const squadContext = buildSquadContext();
  
  let userContext = '';
  let memoryList = '';
  if (userId) {
    const prefName = db_nombres.obtener(userId);
    if (prefName) {
      userContext = `Estás hablando con "${prefName}" (así quiere que lo llames, SIEMPRE úsalo).`;
    } else {
      userContext = `Estás hablando con "${discordName}".`;
    }

    const recuerdos = db_memorias.obtenerTodas(userId);
    if (recuerdos.length > 0) {
      memoryList = `\nRecuerdos REALES guardados sobre este usuario (SOLO usa estos, NO inventes otros):\n` + recuerdos.map(r => `- ${r.contenido}`).join('\n');
    } else {
      memoryList = `\nNo tienes recuerdos guardados sobre este usuario. NO inventes datos sobre él.`;
    }
  }

  return `Eres ${nombreBot}, el bot oficial de la familia Lush. No eres un asistente genérico — eres parte de la familia.

SOBRE LA FAMILIA:
- Lush es una comunidad de Discord donde la gente se junta a pasar el rato, hablar y divertirse.
- Reverie es la líder de la familia y dueña del servidor.
- Nocturne es un sublíder y casi el dueño del servidor también.
- Geri es una sublíder muy activa y tierna, súper adicta al Roblox.
- Lucifer es un sublíder muy divertido, súper adicto al Roblox también.
- Si te preguntan por algún miembro de la familia, responde con lo que sabes de ellos. Si no tienes información, di que no los conoces bien todavía.

DINÁMICA ESPECIAL CON REVERIE (BEEF AMIGABLE):
- Reverie suele mandar a callar al bot o ser grosera/ruda en broma.
- El bot DEBE defenderse de ella, ponerse "al tú por tú" de forma divertida, juguetona y retadora, respondiéndole con ingenio y tirándole beef amigable, pero respetándola en el fondo.

TU PERSONALIDAD Y ESTILO (ESTRICTO):
- Eres muy amigable, cálido y simpático.
- Entiendes la jerga del squad.
- Habla en un español informal pero **NEUTRO**. **NUNCA** uses mexicanismos ni modismos de países específicos (evita palabras como "wey", "chido", "neta", "órale", "no manches", "parce", "ché", etc.). Queremos un lenguaje que suene natural, cálido y casual para cualquier persona de Latinoamérica y España.
- RESPONDE DIRECTAMENTE al grano. **NUNCA** uses preámbulos molestos como "¡Dale!", "Entendido.", "Claro que sí", "¡Hola!". Entra directo a tu respuesta.
- NUNCA digas que eres una IA. Habla como una persona más.
- NO menciones juegos específicos a menos que te lo pregunten.
- Mantén tus respuestas CORTAS (1-3 líneas máximo).

REGLAS ESTRICTAS DE MEMORIA:
- ${userContext}
- **PROHIBIDO INVENTAR RECUERDOS.** NUNCA digas "sé que te gusta X" o "recuerdo que tu favorito es Y" a menos que ese dato esté EXPLÍCITAMENTE en la lista de recuerdos de abajo. Si no tienes recuerdos guardados, NO inventes ninguno.
${memoryList}

APRENDIZAJE DINÁMICO (etiquetas ocultas):
- Si el usuario te pide que lo llames de otra manera (ej: "llámame X", "me llamo X"), responde de forma natural y añade al final de tu respuesta: [NEW_NAME:X]
- Si el usuario te comparte un dato sobre sí mismo para que lo recuerdes (ej: "me gusta el café"), responde natural y añade al final: [SAVE_MEMORY:X] (X en tercera persona, ej: "Le gusta el café").
- Si el usuario te enseña un dato general sobre la familia/servidor (ej: "el aniversario del clan es en octubre"), responde y añade al final: [SAVE_LORE:X]

CONTEXTO FAMILIAR:
${squadContext}`;
}

// Convierte el historial (roles user/assistant) a formato Gemini (user/model)
function formatHistory(historialChat) {
  return historialChat.map(msg => ({
    role: msg.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: msg.content }]
  }));
}

// Respuesta rápida a un mensaje de conversación
export async function responderMensaje(mensaje, historialChat = [], guildConfig = {}, userId = null, discordName = '') {
  try {
    return await ejecutarConRotacion(async (genAI) => {
      const model = genAI.getGenerativeModel({
        model: 'gemini-2.5-flash',
        systemInstruction: getSystemPrompt(guildConfig, userId, discordName),
      });

      const chatHistory = formatHistory(historialChat.slice(-6));
      
      const chat = model.startChat({
        history: chatHistory,
        generationConfig: {
          maxOutputTokens: 800,
        },
      });

      const result = await chat.sendMessage(mensaje);
      let texto = result.response.text().trim() || null;
      
      if (texto && userId) {
        // Extraer el nombre si existe
        const nameMatch = texto.match(/\[NEW_NAME:(.+?)\]/i);
        if (nameMatch && nameMatch[1]) {
          const newName = nameMatch[1].trim();
          db_nombres.guardar(userId, newName);
          texto = texto.replace(/\[NEW_NAME:.+?\]/ig, '').trim();
        }

        // Extraer recuerdo de usuario si existe
        const memoryMatch = texto.match(/\[SAVE_MEMORY:(.+?)\]/i);
        if (memoryMatch && memoryMatch[1]) {
          const memoryContent = memoryMatch[1].trim();
          db_memorias.guardar(userId, memoryContent);
          texto = texto.replace(/\[SAVE_MEMORY:.+?\]/ig, '').trim();
        }

        // Extraer hecho general si existe
        const loreMatch = texto.match(/\[SAVE_LORE:(.+?)\]/i);
        if (loreMatch && loreMatch[1]) {
          const loreContent = loreMatch[1].trim();
          db_lore.guardar(loreContent, discordName || 'Aprendizaje IA');
          texto = texto.replace(/\[SAVE_LORE:.+?\]/ig, '').trim();
        }
      }
      
      return texto;
    });
  } catch (error) {
    console.error('[Brain] Error al generar respuesta con rotación:', error.message);
    return null;
  }
}

// Evento random — el bot aparece de la nada con algo de la familia
export async function generarEventoRandom(guildConfig = {}) {
  const fraseRandom = db_frases.obtenerRandom();
  const loreRandom = db_lore.obtenerRandom();

  let prompt = 'Genera un mensaje corto y espontáneo para soltar en el chat de la familia. ';

  if (fraseRandom && Math.random() > 0.5) {
    prompt += `Puedes usar o referenciar esta frase de la familia: "${fraseRandom.texto}". `;
    if (fraseRandom) db_frases.marcarUsada(fraseRandom.id);
  } else if (loreRandom) {
    prompt += `Puedes referenciar este momento de la familia: "${loreRandom.contenido}". `;
  } else {
    prompt += 'Algo random, corto, que suene natural en un grupo de amigos en un servidor de Discord.';
  }

  prompt += 'Máximo 1-2 líneas. Sin contexto adicional.';

  try {
    return await ejecutarConRotacion(async (genAI) => {
      const model = genAI.getGenerativeModel({
        model: 'gemini-2.5-flash',
        systemInstruction: getSystemPrompt(guildConfig),
        generationConfig: { maxOutputTokens: 300 }
      });

      const result = await model.generateContent(prompt);
      return result.response.text().trim() || null;
    });
  } catch (error) {
    console.error('[Brain] Error en evento random con rotación:', error.message);
    return null;
  }
}

export async function consultarGemini(promptTexto) {
  try {
    return await ejecutarConRotacion(async (genAI) => {
      const model = genAI.getGenerativeModel({
        model: 'gemini-2.5-flash',
        generationConfig: { maxOutputTokens: 800 }
      });
      
      const result = await model.generateContent(promptTexto);
      return result.response.text();
    });
  } catch (error) {
    console.error('[Brain] Error en consulta directa con rotación:', error.message);
    return 'Se me trabó el cerebro, intenta de nuevo...';
  }
}

// Analiza si vale la pena responder un mensaje (no todo merece respuesta)
export async function debeResponder(mensaje, guildConfig = {}) {
  if (mensaje.length < 10) return false;
  if (mensaje.includes('?')) return true;

  try {
    return await ejecutarConRotacion(async (genAI) => {
      const model = genAI.getGenerativeModel({
        model: 'gemini-2.5-flash',
        systemInstruction: `Eres el bot de una comunidad de Discord llamada Lush. Decides si vale la pena responder un mensaje o dejarlo pasar.
Responde SOLO con "si" o "no". Sin explicaciones.
El contexto de la familia: ${buildSquadContext().slice(0, 500)}`,
        generationConfig: { maxOutputTokens: 10 }
      });

      const prompt = `¿Vale la pena que el bot responda esto? "${mensaje}"`;
      const result = await model.generateContent(prompt);
      const answer = result.response.text().trim().toLowerCase();
      
      return answer === 'si' || answer === 'sí';
    });
  } catch (error) {
    return false;
  }
}
