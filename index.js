const http = require('http');
const { verdadesPicantes } = require('./verdadesPicantes');
const port = process.env.PORT || 3000;

http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Bot activo 24/7');
}).listen(port, () => {
  console.log(`Servidor web escuchando en el puerto ${port}`);
});
const TelegramBot = require('node-telegram-bot-api').default || require('node-telegram-bot-api');

const token = process.env.TELEGRAM_TOKEN;
const bot = new TelegramBot(token, { polling: true });

// --- CALENDARIO DINÁMICO A DISTANCIA ---
function obtenerCalendarioHoy() {
    const ahora = new Date();
    const diaSemana = ahora.getDay();
    const inicioAño = new Date(ahora.getFullYear(), 0, 1);
    const dias = Math.floor((ahora - inicioAño) / (24 * 60 * 60 * 1000));
    const numeroSemana = Math.ceil((dias + inicioAño.getDay() + 1) / 7);

    const esSemanaA = numeroSemana % 2 === 0;

    const calendarioA = {
        1: "🎯 *Lunes:* Parchís en pareja (Videollamada) 📱",
        2: "🎴 *Martes:* UNO! Showdown online 🎴",
        3: "🔫 *Miércoles:* Free Fire - Dúo Imparable 💥",
        4: "🎬 *Jueves:* Noche de Cine en Rave / Discord 🍿",
        5: "🎲 *Viernes:* Preguntas Picantes y Copas a distancia 🍷",
        6: "💥 *Sábado:* Free Fire o Juegos de Mente en llamada 🧩",
        0: "😴 *Domingo:* Llamada en pijama / Hablar hasta dormirse 💤"
    };

    const calendarioB = {
        1: "🎴 *Lunes:* UNO! de Revancha online 🎴",
        2: "🔫 *Martes:* Free Fire - Dúo Dinámico 💥",
        3: "🎯 *Miércoles:* Parchís al límite 🎯",
        4: "🍕 *Jueves:* Pedir la misma comida y cenar en llamada 🍕",
        5: "🍿 *Viernes:* Maratón de Anime / Serie en llamada 📺",
        6: "🌶️ *Sábado:* Noche de Verdad o Reto Picante 🙈",
        0: "💖 *Domingo:* Noche de confidencias y juegos 🎲"
    };

    const tipoSemana = esSemanaA ? "🅰️ (Semana A)" : "🅱️ (Semana B)";
    const juegoHoy = esSemanaA ? calendarioA[diaSemana] : calendarioB[diaSemana];

    return `🗓️ *CALENDARIO A DISTANCIA* ${tipoSemana}\n\n👉 *Hoy toca:* \n${juegoHoy}\n\n_(Rota automáticamente cada semana para romper la rutina)_`;
}

// --- BANCO DE DATOS DE ENTERTENIMIENTO ---
const modoImitacion = [
    "🎭 *Reto de Imitación (2 Minutos):*\nAmbos deben hablar en la llamada usando un **acento dramático de telenovela**.",
    "🎭 *Reto de Imitación (2 Minutos):*\nTienen que responder a todo lo que diga el otro susurrando como si fuera un **secreto confidencial**.",
    "🎭 *Reto de Imitación (2 Minutos):*\nDeben hablar imitando el tono de un **locutor de radio o presentador de noticias**.",
    "🎭 *Reto de Imitación (2 Minutos):*\nCada uno debe imitar la forma de hablar y los gestos del **otro** (¡a ver qué tan bien se conocen!).",
    "🎭 *Reto de Imitación (2 Minutos):*\nHablen como si fueran dos **villanos de película** planeando apoderarse del mundo."
];

const preguntasProfundas = [
    "💬 *Pregunta Nocturna:*\n¿Qué es algo que nunca le has contado a nadie sobre tu infancia?",
    "💬 *Pregunta Nocturna:*\n¿Cuál ha sido el momento en el que te has sentido más orgulloso/a de ti mismo/a?",
    "💬 *Pregunta Nocturna:*\nSi pudieras cambiar una sola decisión de tu pasado, ¿cuál sería?",
    "💬 *Pregunta Nocturna:*\n¿Qué es lo que más valoras de la forma en que nos llevamos tú y yo?",
    "💬 *Pregunta Nocturna:*\n¿Cuál es tu mayor sueño o meta por cumplir este año?"
];

const ruletaCastigosLlamada = [
    "📷 *Castigo:* Tómate una foto graciosa con filtro y ponla de perfil por 1 hora.",
    "🎤 *Castigo:* Canta el coro de una canción romántica mirando a la cámara en llamada.",
    "💬 *Castigo:* Escribe una mini carta de amor de 3 líneas y léela en voz alta.",
    "💃 *Castigo:* Haz un baile gracioso de 10 segundos en videollamada.",
    "🤪 *Castigo:* Mantén una mueca rara durante 30 segundos sin reírte."
];

const triviasDistancia = [
    "🧠 *Trivia LDR:*\n\n¿Sabes cuál es la hora exacta en la que suelo estar más libre para hablar?",
    "🧠 *Trivia LDR:*\n\n¿Recuerdas cuál fue la primera foto que nos enviamos por chat?",
    "🧠 *Trivia LDR:*\n\n¿Qué juego es en el que más te gusta ganarme en llamada?",
    "🧠 *Trivia LDR:*\n\n¿Cuál es la prenda de vestir mía que más te gusta cuando me ves en cámara?"
];

// --- BOLA 8 LIMPIA (Sin preguntas de vernos) ---
const respuestasBola8 = [
    "🔮 ¡Sí, 100% seguro!",
    "🔮 Mmm... mejor no te lo digo ahora 😜",
    "🔮 Todo apunta a que SÍ.",
    "🔮 Mis fuentes dicen que NO, ¡inténtalo de nuevo!",
    "🔮 Pregúntamelo otra vez en 5 minutos 😉",
    "🔮 Definitivamente no.",
    "🔮 ¡Claro que sí, sin duda!"
];

const quePrefieresLDR = [
    "🤔 ¿Prefieres: Ganar una partida de Free Fire/Parchís juntos 🏆 O que te cante una canción en llamada 🎤?",
    "🤔 ¿Prefieres: Llamadas todos los días de 15 minutos ⏱️ O videollamadas largas de 3 horas los fines de semana 📹?",
    "🤔 ¿Prefieres: Ver una peli de terror juntos 👻 O una maratón de comedia 🍿?"
];

const verdadesPicantes = [
    "¿Qué fue lo primero que pensaste de mí cuando empezamos a hablar por chat?",
    "¿Qué es lo más atrevido que te gustaría decirme en llamada cuando estemos a solas?",
    "¿Qué es lo que más te atrae de mi voz o mi forma de hablar?",
    "¿Qué harías si en este momento te enviara un mensaje picante?",
    "cuando fue la ultima vez que te mojaste o te excitaste pensando en mi?",
    "¿Cuál es tu fantasía más atrevida que te gustaría cumplir conmigo?",
    "¿Qué parte de mi cuerpo te resulta más irresistible y por qué?",
    "Si pudieras elegir un lugar para tener una cita virtual muy íntima, ¿dónde sería y qué haríamos?",
    "¿Qué es lo más travieso que harias en una videollamada conmigo?",
    "Si tuvieras que describir nuestra relación en una palabra, ¿cuál sería y por qué?",
    " Si pudieras enviarme un mensaje provocativo ahora mismo, ¿qué dirías?",
    "¿Qué es lo más atrevido que te gustaría que hiciéramos juntos en una videollamada?",
    "Si pudieras elegir un juego picante para jugar en llamada, ¿cuál sería y cómo lo jugaríamos?",
    "¿Cuál es tu recuerdo más travieso o excitante de nosotros hasta ahora?",
    "Si tuvieras que describir nuestra química en una frase, ¿cuál sería?"
];
exports.verdadesPicantes = verdadesPicantes;
const retosPicantes = [
    "📷 Manda una foto sexy o provocativa por el chat ahora mismo.",
    "🎙️ Manda una nota de voz de 10 segundos susurrándome algo coqueto al oído.",
    "🎥 Graba un video corto enviándome un beso coqueto frente a la cámara.",
    "💬 Escríbeme un mensaje corto diciéndome algo coqueto.",
    "📷 manda un video bailando provocativamente de 15 min,si tu pareja se calienta recibe una penalización",
    "📷 tocate en la videollamada por 1 min. si tu pareja se moja/se excita recibe una penalizacion",
    "💬 enviale un mensaje provocativo a tu pareja y si se excita recibe una penalizacion",
    "🎥 graba un video provocativo y enviaselo a tu pareja, si se excita recibe una penalizacion",
    "💬 dile a tu pareja que te haga un reto provocativo y si se excita recibe una penalizacion",
    "🎥 graba un video provocativo y enviaselo a tu pareja, si se excita recibe una penalizacion",
    "💬reta a tu pareja a un desafio sin limites"
    ];

// --- MENÚ PRINCIPAL ---
bot.onText(/\/start/, (msg) => {
    const opciones = {
        reply_markup: {
            keyboard: [
                ['🎮 Calendario LDR', '🎭 Reto de Imitación'],
                ['💬 Preguntas Profundas', '🎲 Castigo para Llamada'],
                ['🧠 Trivia de Pareja', '🔮 Bola 8 Mágica'],
                ['🤔 ¿Qué prefieres?', '🔥 Verdad / Reto']
            ],
            resize_keyboard: true
        }
    };
    bot.sendMessage(msg.chat.id, "llego el desmadre,¿estan listos para el caos?", opciones);
});

// --- RESPUESTAS DE MENÚ ---
bot.on('message', (msg) => {
    const chatId = msg.chat.id;
    const texto = msg.text;

    if (texto === '🎮 Calendario LDR') {
        bot.sendMessage(chatId, obtenerCalendarioHoy(), { parse_mode: 'Markdown' });
    }
    if (texto === '🎭 Reto de Imitación') {
        const imita = modoImitacion[Math.floor(Math.random() * modoImitacion.length)];
        bot.sendMessage(chatId, imita, { parse_mode: 'Markdown' });
    }
    if (texto === '💬 Preguntas Profundas') {
        const preg = preguntasProfundas[Math.floor(Math.random() * preguntasProfundas.length)];
        bot.sendMessage(chatId, preg, { parse_mode: 'Markdown' });
    }
    if (texto === '🎲 Castigo para Llamada') {
        const castigo = ruletaCastigosLlamada[Math.floor(Math.random() * ruletaCastigosLlamada.length)];
        bot.sendMessage(chatId, `🎰 *Ruleta para el perdedor de la partida:*\n\n${castigo}`, { parse_mode: 'Markdown' });
    }
    if (texto === '🧠 Trivia de Pareja') {
        const t = triviasDistancia[Math.floor(Math.random() * triviasDistancia.length)];
        bot.sendMessage(chatId, t, { parse_mode: 'Markdown' });
    }
    if (texto === '🔮 Bola 8 Mágica') {
        const r = respuestasBola8[Math.floor(Math.random() * respuestasBola8.length)];
        bot.sendMessage(chatId, `Haz cualquier pregunta de SÍ o NO en voz alta... 🤔\n\n${r}`);
    }
    if (texto === '🤔 ¿Qué prefieres?') {
        const qp = quePrefieresLDR[Math.floor(Math.random() * quePrefieresLDR.length)];
        bot.sendMessage(chatId, qp);
    }
    if (texto === '🔥 Verdad / Reto') {
        bot.sendMessage(chatId, '🌶️ *Modo Picante:* ¿Qué eliges?', {
            reply_markup: {
                inline_keyboard: [
                    [{ text: '🗣️ Verdad', callback_data: 'v' }, { text: '🔥 Reto Picante', callback_data: 'r' }]
                ]
            }
        });
    }
});

// --- VERDAD O RETO INLINE ---
bot.on('callback_query', (query) => {
    const chatId = query.message.chat.id;
    if (query.data === 'v') {
        const v = verdadesPicantes[Math.floor(Math.random() * verdadesPicantes.length)];
        bot.sendMessage(chatId, `🫣 *VERDAD:* ${v}`, { parse_mode: 'Markdown' });
    }
    if (query.data === 'r') {
        const r = retosPicantes[Math.floor(Math.random() * retosPicantes.length)];
        bot.sendMessage(chatId, `🔥 *RETO PICANTE:* ${r}`, { parse_mode: 'Markdown' });
    }
});

console.log('¡Bot actualizado y encendido! 🤖🎉');