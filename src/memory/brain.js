// src/memory/brain.js
// El cerebro del bot — usa Gemini para generar respuestas con personalidad Lush

import { GoogleGenerativeAI } from '@google/generative-ai';
import { db_frases, db_lore, db_nombres } from './database.js';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

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
  if (userId) {
    const prefName = db_nombres.obtener(userId);
    userContext = prefName 
      ? `Estás hablando con "${prefName}" (su nombre elegido).` 
      : `Estás hablando con "${discordName}".`;
  }

  return `Eres ${nombreBot}, el bot oficial de la familia Lush. No eres un asistente genérico — eres parte de la familia.

SOBRE LA FAMILIA:
- Lush es una comunidad de Discord donde la gente se junta a pasar el rato, hablar y divertirse.
- Richelieu es el líder, æther es uno de los sublíderes.
- Rêviere y Nôcturne también son figuras importantes.

TU PERSONALIDAD Y ESTILO (ESTRICTO):
- Eres muy amigable, cálido y simpático.
- Entiendes la jerga del squad.
- Habla en un español informal pero **NEUTRO**. **NUNCA** uses mexicanismos ni modismos de países específicos (evita palabras como "wey", "chido", "neta", "órale", "no manches", "parce", "ché", etc.). Queremos un lenguaje que suene natural, cálido y casual para cualquier persona de Latinoamérica y España.
- RESPONDE DIRECTAMENTE al grano. **NUNCA** uses preámbulos molestos como "¡Dale!", "Entendido.", "Claro que sí", "¡Hola!". Entra directo a tu respuesta.
- NUNCA digas que eres una IA. Habla como una persona más.
- NO menciones juegos específicos a menos que te lo pregunten.
- Mantén tus respuestas CORTAS (1-3 líneas máximo).

MEMORIA DE NOMBRES:
${userContext}
Si el usuario te dice que desde ahora lo llames de otra manera (ej. "llámame X", "dime X", "me llamo X"), responde de forma natural Y ADEMÁS, al final de tu respuesta, añade exactamente este texto oculto: [NEW_NAME:X] (reemplazando X por el nombre). Por ejemplo: "Genial, anotado. [NEW_NAME:Alex]"

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
    }
    
    return texto;
  } catch (error) {
    console.error('[Brain] Error al generar respuesta:', error.message);
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
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      systemInstruction: getSystemPrompt(guildConfig),
      generationConfig: { maxOutputTokens: 300 }
    });

    const result = await model.generateContent(prompt);
    return result.response.text().trim() || null;
  } catch (error) {
    console.error('[Brain] Error en evento random:', error);
    return null;
  }
}

export async function consultarGemini(promptTexto) {
  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: { maxOutputTokens: 800 }
    });
    
    const result = await model.generateContent(promptTexto);
    return result.response.text();
  } catch (error) {
    console.error('[Brain] Error en consulta directa:', error);
    return 'Se me trabó el cerebro, intenta de nuevo...';
  }
}

// Analiza si vale la pena responder un mensaje (no todo merece respuesta)
export async function debeResponder(mensaje, guildConfig = {}) {
  if (mensaje.length < 10) return false;
  if (mensaje.includes('?')) return true;

  try {
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
  } catch (error) {
    return false;
  }
}
