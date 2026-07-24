const http = require('http');
const TelegramBot = require('node-telegram-bot-api').default || require('node-telegram-bot-api');
const axios = require('axios');
const { GoogleGenAI } = require('@google/genai');
const verdadesPicantes = [
    "¿Qué fue lo primero que pensaste cuando viste una foto mía por primera vez?",
    "¿Cuál es tu fantasía o momento más coqueto que quisieras vivir cuando nos veamos?",
    "¿Qué prenda de vestir mía te parece la más atractiva cuando nos vemos por llamada?",
    "Si tuvieras que describir nuestro nivel de química en una palabra, ¿cuál sería?",
    "¿Qué es algo travieso que has pensado sobre mí y no me has contado?",
];

// --- SERVIDOR HTTP PA' MANTENER RENDER ACTIVO ---
const port = process.env.PORT || 3000;
http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Bot activo 24/7');
}).listen(port, () => {
  console.log(`Servidor web escuchando en el puerto ${port}`);
});

// --- INICIALIZACIÓN BOT & IA ---
const token = process.env.TELEGRAM_TOKEN;
const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const bot = new TelegramBot(token, { polling: true });

let ai;
if (GEMINI_API_KEY) {
  ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
}

// --- BASES DE DATOS EN MEMORIA (ALMACENAMIENTO DE DATOS) ---
const capsuleStorage = [];     // Cápsula del tiempo / Buzón
const metasStorage = [];       // Metas y Deseos
const seriesVistasStorage = [];// Registro de series vistas
const userPoints = {};         // Buscador de Puntos

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

// --- BANCOS DE DATOS Y NUEVAS FUNCIONES ---
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
    "🤔 ¿Prefieres: Ver una peli de terror juntos 👻 O una maratón de comedia 🍿?",
];

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
    "💬 reta a tu pareja a un desafio sin limites"
];

// --- NUEVAS FUNCIONES AGREGADAS ---
const razonesParaQuerte = [
    "Me encanta tu sonrisa cada vez que te veo en pantalla. 😍",
    "Adoro la forma en que me haces reír incluso en mis días difíciles.",
    "Amo cómo apoyas mis sueños y confías en mí.",
    "Amo tu voz cuando me hablas bonito por llamada.",
    "Me apasiona la química tan única que tenemos a pesar de la distancia.",
    "Amo lo cariñosa/o y especial que eres conmigo todos los días.",
    "Amo cómo nos entendemos casi sin decir palabras."
];

const apodosCoquetos = [
    "Mi terroncito de azúcar 🍯", "Mi bombón picante 🌶️", "Mi cielito hermoso 🌌",
    "Mi reina/rey consentida/o 👑", "Mi vida entera 💖", "Mi tentación favorita 😈"
];

const adivinanzasCanciones = [
    "🎵 *Adivina la Canción:* 'And I will always love you...'\n¿Qué artista o canción es?",
    "🎵 *Adivina la Frase:* 'Tú eres mi momento favorito del día.'\n¿Quién de los dos la dijo primero?"
];

const pelisSeriesRecomendadas = [
    "🎬 *Película:* 'Your Name' (Anime / Romance) - Perfecta para ver a distancia.",
    "🍿 *Serie:* 'La Casa de Papel' - Suspenso y maratón asegurado.",
    "🎬 *Película:* 'About Time' - Un detalle hermoso sobre el amor y el tiempo."
];

const dadosPicantes = [
    "🎲 *Dado Picante:* 'Susurra un secreto travieso' + 'En una nota de voz de 10 seg' 🔥",
    "🎲 *Dado Picante:* 'Envía una foto coqueta' + 'Con la luz bajita' 🫣",
    "🎲 *Dado Picante:* 'Haz una promesa atrevida' + 'Para cuando nos veamos en persona' 💋"
];

const adivinaMemes = [
    "🖼️ *Adivina el Meme:* Un gato sentado en la mesa siendo regañado por una mujer. ¿Cómo se llama el meme?",
    "🖼️ *Adivina el Meme:* Un perro sentado tranquilo en medio del fuego diciendo 'This is fine'."
];

const compatibilidadDiaria = [
    "📊 *Test de Compatibilidad Hoy:* ¡Están al **99%**! Hoy es un día perfecto para una noche de juegos. 💕",
    "📊 *Test de Compatibilidad Hoy:* ¡Sintonía al **100%**! La química está por las nubes. 🔥"
];

const tresVerdadesUnaMentira = [
    "🧩 *3 Verdades y 1 Mentira:*\n1. Me encanta el café por la mañana.\n2. Sé bailar salsa profesionalmente.\n3. Me emociono cada vez que me llamas.\n4. Mi juego favorito es Free Fire.\n\n¿Cuál es la MENTIRA? 🤔"
];

const preguntasIncomodasCoquetas = [
    "🫣 *Pregunta Coqueta:* ¿Qué fue lo primero que pensaste cuando viste mi foto por primera vez?",
    "🌶️ *Pregunta Incómoda:* ¿Qué harías si de repente aparezco en tu puerta sin avisar?"
];

const cuponesAmor = [
    "🎟️ *CUPÓN VIRTUAL:* Válido por 'Elegir la película o juego de hoy sin objeciones' 🍿",
    "🎟️ *CUPÓN VIRTUAL:* Válido por 'Un masaje relajante acumulado para cuando nos veamos' 💆‍♂️💆‍♀️",
    "🎟️ *CUPÓN VIRTUAL:* Válido por 'Una sesión de mimos y elogios por llamada' 💖"
];

const desafiosSensuales = [
    "💋 *Desafío Sensual:* Envía un mensaje de voz de 5 segundos susurrando lo que más te gusta de mí.",
    "🔥 *Desafío Sensual:* Manda una foto sosteniendo un letrero que diga algo provocativo."
];

// --- MENÚ PRINCIPAL CON TECLADO EXPANDIDO ---
bot.onText(/\/start/, (msg) => {
    const opciones = {
        reply_markup: {
            keyboard: [
                ['🎮 Calendario LDR', '🎭 Reto de Imitación'],
                ['💬 Preguntas Profundas', '🎲 Castigo para Llamada'],
                ['🧠 Trivia de Pareja', '🔮 Bola 8 Mágica'],
                ['🤔 ¿Qué prefieres?', '🔥 Verdad / Reto'],
                ['💖 100 Razones', '❤️ Te Extraño'],
                ['📹 Pase a Videollamada', '🫂 Beso/Abrazo Virtual'],
                ['🎭 Estado de Ánimo', '🎰 Dado / Volado'],
                ['🍿 Pelis / Series', '🏷️ Apodo Coqueto'],
                ['🌶️ Dado Picante', '🎟️ Cupones de Amor'],
                ['✨ Más Comandos (/ayuda)']
            ],
            resize_keyboard: true
        }
    };
    bot.sendMessage(msg.chat.id, "¡Llegó el desmadre! 💥\n\nPresiona los botones del menú o escribe `/ayuda` para ver la lista completa de comandos interactivos.", opciones);
});

// --- MENÚ DE AYUDA Y LISTA COMPLETA DE COMANDOS ---
bot.onText(/\/ayuda/, (msg) => {
    const ayudaTxt = `
✨ **LISTA COMPLETA DE COMANDOS DISPONIBLES** ✨

💌 **Afecto y Detalles:**
• /razones - Muestra una razón de por qué te quiero.
• /extraño - Envía una notificación instantánea de "Te extraño".
• /videollamada - Alerta para pasar a videollamada.
• /abrazo - Envia un abrazo o beso virtual.
• /apodo - Generador de apodo coqueto del día.

🎲 **Juegos y Diversión:**
• /volado - Lanza un dado o moneda.
• /aventura - Inicia una mini aventura de decisiones.
• /adivina - Adivina la canción o frase.
• /meme - Adivina el meme.
• /compatibilidad - Revisa la compatibilidad del día.
• /3v1m - Juega a 3 Verdades y 1 Mentira.
• /puntos - Revisa tus puntos acumulados.

📌 **Organizador y Recuerdos:**
• /capsula [mensaje] - Guarda un mensaje secreto en la cápsula.
• /vercapsula - Lee los mensajes guardados.
• /meta [meta] - Agrega una meta/deseo en pareja.
• /vermetas - Mira la lista de metas y deseos.
• /peli [nombre] - Agrega o mira series/películas vistas.
• /divisas [monto] - Convierte USD a EUR / moneda local.

🔥 **Picante y Coqueteo:**
• /dadopicante - Lanza un reto picante en combinación.
• /preguntaIncomoda - Lanza una pregunta coqueta.
• /cupon - Te entrega un cupón de amor canjeable.
• /desafio - Un desafío sensual para la semana.
• /secreto [mensaje] - Confesión anónima al bot.

🤖 **Asistente AI:**
• /ia [tu pregunta] - Asistente Gemini para resolver dudas juntos.
`;
    bot.sendMessage(msg.chat.id, ayudaTxt, { parse_mode: 'Markdown' });
});

// --- MANEJO DE MENSAJES AUTOMÁTICOS Y COMANDOS DEL MENU ---
bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const texto = msg.text;

    if (!texto) return;

    // RESPUESTAS AUTOMÁTICAS DIVERTIDAS
    const textoMin = texto.toLowerCase();
    if (textoMin.includes('te amo')) {
        bot.sendMessage(chatId, "💖 ¡El bot detectó amor puro! Yo también los amo a ambos 🥰");
    } else if (textoMin.includes('te extraño')) {
        bot.sendMessage(chatId, "🥺 ¡Alguien por aquí está extrañando mucho! Mándense un abrazo virtual con `/abrazo`");
    }

    // BOTONES DEL TECLADO
    if (texto === '🎮 Calendario LDR') bot.sendMessage(chatId, obtenerCalendarioHoy(), { parse_mode: 'Markdown' });
    if (texto === '🎭 Reto de Imitación') bot.sendMessage(chatId, modoImitacion[Math.floor(Math.random() * modoImitacion.length)], { parse_mode: 'Markdown' });
    if (texto === '💬 Preguntas Profundas') bot.sendMessage(chatId, preguntasProfundas[Math.floor(Math.random() * preguntasProfundas.length)], { parse_mode: 'Markdown' });
    if (texto === '🎲 Castigo para Llamada') bot.sendMessage(chatId, `🎰 *Ruleta perdedora:*\n\n${ruletaCastigosLlamada[Math.floor(Math.random() * ruletaCastigosLlamada.length)]}`, { parse_mode: 'Markdown' });
    if (texto === '🧠 Trivia de Pareja') bot.sendMessage(chatId, triviasDistancia[Math.floor(Math.random() * triviasDistancia.length)], { parse_mode: 'Markdown' });
    if (texto === '🔮 Bola 8 Mágica') bot.sendMessage(chatId, `Haz tu pregunta en voz alta... 🤔\n\n${respuestasBola8[Math.floor(Math.random() * respuestasBola8.length)]}`);
    if (texto === '🤔 ¿Qué prefieres?') bot.sendMessage(chatId, quePrefieresLDR[Math.floor(Math.random() * quePrefieresLDR.length)]);
    
    if (texto === '🔥 Verdad / Reto') {
        bot.sendMessage(chatId, '🌶️ *Modo Picante:* ¿Qué eliges?', {
            reply_markup: {
                inline_keyboard: [
                    [{ text: '🗣️ Verdad', callback_data: 'v' }, { text: '🔥 Reto Picante', callback_data: 'r' }]
                ]
            }
        });
    }

    if (texto === '💖 100 Razones' || texto === '/razones') {
        bot.sendMessage(chatId, `💖 *Razón para quererte:* \n\n${razonesParaQuerte[Math.floor(Math.random() * razonesParaQuerte.length)]}`);
    }

    if (texto === '❤️ Te Extraño' || texto === '/extraño') {
        bot.sendMessage(chatId, "📢 *NOTIFICACIÓN INSTANTÁNEA:* ¡Te están extrañando intensamente en este momento! 🥺❤️", { parse_mode: 'Markdown' });
    }

    if (texto === '📹 Pase a Videollamada' || texto === '/videollamada') {
        bot.sendMessage(chatId, "📹 *¡ALERTA DE VIDEOLLAMADA!* Conéctate ahora mismo, te están esperando frente a la cámara. 🤳✨", { parse_mode: 'Markdown' });
    }

    if (texto === '🫂 Beso/Abrazo Virtual' || texto === '/abrazo') {
        bot.sendMessage(chatId, "🫂 *¡ABRAZO Y BESO VIRTUAL ENVIADO!* 💋\n\nSiente todo el cariño cruzando la pantalla.", { parse_mode: 'Markdown' });
    }

    if (texto === '🎭 Estado de Ánimo') {
        bot.sendMessage(chatId, '¿Cómo te sientes hoy?', {
            reply_markup: {
                inline_keyboard: [
                    [{ text: '😄 Feliz', callback_data: 'animo_feliz' }, { text: '🥰 Romántico/a', callback_data: 'animo_romantico' }],
                    [{ text: '😴 Cansado/a', callback_data: 'animo_cansado' }, { text: '🥺 Necesito mimos', callback_data: 'animo_mimos' }]
                ]
            }
        });
    }

    if (texto === '🎰 Dado / Volado' || texto === '/volado') {
        const resultadoMoneda = Math.random() < 0.5 ? "🪙 Cara" : "🪙 Cruz";
        const dado = Math.floor(Math.random() * 6) + 1;
        bot.sendMessage(chatId, `🎲 *Lanzamiento Mágico:*\n\n• **Moneda:** ${resultadoMoneda}\n• **Dado (1-6):** ${dado}`, { parse_mode: 'Markdown' });
    }

    if (texto === '🍿 Pelis / Series') {
        bot.sendMessage(chatId, pelisSeriesRecomendadas[Math.floor(Math.random() * pelisSeriesRecomendadas.length)], { parse_mode: 'Markdown' });
    }

    if (texto === '🏷️ Apodo Coqueto' || texto === '/apodo') {
        bot.sendMessage(chatId, `✨ *Tu apodo coqueto de hoy es:* ${apodosCoquetos[Math.floor(Math.random() * apodosCoquetos.length)]}`);
    }

    if (texto === '🌶️ Dado Picante' || texto === '/dadopicante') {
        bot.sendMessage(chatId, dadosPicantes[Math.floor(Math.random() * dadosPicantes.length)], { parse_mode: 'Markdown' });
    }

    if (texto === '🎟️ Cupones de Amor' || texto === '/cupon') {
        bot.sendMessage(chatId, cuponesAmor[Math.floor(Math.random() * cuponesAmor.length)], { parse_mode: 'Markdown' });
    }

    if (texto === '✨ Más Comandos (/ayuda)') {
        bot.sendMessage(chatId, "Escribe `/ayuda` para ver la lista completa con todos los comandos y herramientas.", { parse_mode: 'Markdown' });
    }
});

// --- COMANDOS CON PARÁMETROS Y FUNCIONES ESPECÍFICAS ---

// Aventura Interactiva
bot.onText(/\/aventura/, (msg) => {
    bot.sendMessage(msg.chat.id, "🏰 *Elige tu Propia Aventura:*\n\nEstán atrapados en un castillo mágico a distancia. ¿Qué camino toman?", {
        reply_markup: {
            inline_keyboard: [
                [{ text: '🚪 Abrir puerta roja', callback_data: 'adv_roja' }, { text: '🗝️ Abrir puerta azul', callback_data: 'adv_azul' }]
            ]
        },
        parse_mode: 'Markdown'
    });
});

// Adivina Canción / Meme / Compatibilidad / 3V1M
bot.onText(/\/adivina/, (msg) => bot.sendMessage(msg.chat.id, adivinanzasCanciones[Math.floor(Math.random() * adivinanzasCanciones.length)], { parse_mode: 'Markdown' }));
bot.onText(/\/meme/, (msg) => bot.sendMessage(msg.chat.id, adivinaMemes[Math.floor(Math.random() * adivinaMemes.length)], { parse_mode: 'Markdown' }));
bot.onText(/\/compatibilidad/, (msg) => bot.sendMessage(msg.chat.id, compatibilidadDiaria[Math.floor(Math.random() * compatibilidadDiaria.length)], { parse_mode: 'Markdown' }));
bot.onText(/\/3v1m/, (msg) => bot.sendMessage(msg.chat.id, tresVerdadesUnaMentira[Math.floor(Math.random() * tresVerdadesUnaMentira.length)], { parse_mode: 'Markdown' }));
bot.onText(/\/preguntaIncomoda/, (msg) => bot.sendMessage(msg.chat.id, preguntasIncomodasCoquetas[Math.floor(Math.random() * preguntasIncomodasCoquetas.length)], { parse_mode: 'Markdown' }));
bot.onText(/\/desafio/, (msg) => bot.sendMessage(msg.chat.id, desafiosSensuales[Math.floor(Math.random() * desafiosSensuales.length)], { parse_mode: 'Markdown' }));

// Buscador de Puntos
bot.onText(/\/puntos/, (msg) => {
    const uid = msg.from.id;
    userPoints[uid] = (userPoints[uid] || 0) + 10;
    bot.sendMessage(msg.chat.id, `🏆 *Puntos de Amor:* Tienes **${userPoints[uid]} puntos** acumulados por interactuar.`, { parse_mode: 'Markdown' });
});

// Cápsula del tiempo
bot.onText(/\/capsula (.+)/, (msg, match) => {
    capsuleStorage.push(match[1]);
    bot.sendMessage(msg.chat.id, "📦 ¡Mensaje guardado con éxito en la Cápsula del Tiempo!");
});
bot.onText(/\/vercapsula/, (msg) => {
    if (capsuleStorage.length === 0) return bot.sendMessage(msg.chat.id, "📦 La cápsula del tiempo está vacía por ahora.");
    bot.sendMessage(msg.chat.id, `📦 *Cápsula del Tiempo:*\n\n` + capsuleStorage.map((m, i) => `${i+1}. ${m}`).join('\n'), { parse_mode: 'Markdown' });
});

// Metas y Deseos
bot.onText(/\/meta (.+)/, (msg, match) => {
    metasStorage.push(match[1]);
    bot.sendMessage(msg.chat.id, "🎯 ¡Meta agregada a la lista de deseos!");
});
bot.onText(/\/vermetas/, (msg) => {
    if (metasStorage.length === 0) return bot.sendMessage(msg.chat.id, "🎯 Aún no han guardado metas juntos.");
    bot.sendMessage(msg.chat.id, `🎯 *Lista de Metas y Deseos:*\n\n` + metasStorage.map((m, i) => `• ${m}`).join('\n'), { parse_mode: 'Markdown' });
});

// Registro de Series Vistas
bot.onText(/\/peli (.+)/, (msg, match) => {
    seriesVistasStorage.push(match[1]);
    bot.sendMessage(msg.chat.id, `🍿 ¡'${match[1]}' agregada a la lista de series/pelis vistas juntos!`);
});

// Confesión Anónima
bot.onText(/\/secreto (.+)/, (msg, match) => {
    bot.sendMessage(msg.chat.id, `🤫 *CONFESIÓN ANÓNIMA:* \n\n"${match[1]}"`, { parse_mode: 'Markdown' });
});

// Conversor de Monedas (Simulado)
bot.onText(/\/divisas (.+)/, (msg, match) => {
    const usd = parseFloat(match[1]);
    if (isNaN(usd)) return bot.sendMessage(msg.chat.id, "Por favor ingresa un número válido. Ej: `/divisas 50`");
    const eur = (usd * 0.92).toFixed(2);
    bot.sendMessage(msg.chat.id, `🔱 *Conversor de Moneda:*\n\n💵 **$${usd} USD** equivalen aprox. a **€${eur} EUR**`, { parse_mode: 'Markdown' });
});

// VERDAD O RETO & CALLBACKS
bot.on('callback_query', (query) => {
    const chatId = query.message.chat.id;
    const data = query.data;

    if (data === 'v') bot.sendMessage(chatId, `🫣 *VERDAD:* ${verdadesPicantes[Math.floor(Math.random() * verdadesPicantes.length)]}`, { parse_mode: 'Markdown' });
    if (data === 'r') bot.sendMessage(chatId, `🔥 *RETO PICANTE:* ${retosPicantes[Math.floor(Math.random() * retosPicantes.length)]}`, { parse_mode: 'Markdown' });

    if (data.startsWith('animo_')) {
        const tipo = data.split('_')[1];
        bot.sendMessage(chatId, `🎭 *Estado de ánimo actualizado:* Tu pareja acaba de marcar que se siente **${tipo.toUpperCase()}** hoy. 💖`, { parse_mode: 'Markdown' });
    }

    if (data === 'adv_roja') bot.sendMessage(chatId, "🚪 Entraron a la habitación roja y encontraron un cofre con 100 besos virtuales. 💋");
    if (data === 'adv_azul') bot.sendMessage(chatId, "🗝️ La puerta azul los llevó a una cita virtual con antorchas y música romántica. 🎶");
});

// --- COMANDO ASISTENTE IA GEMINI ---
bot.onText(/\/ia (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const duda = match[1];

  if (!ai) {
    return bot.sendMessage(chatId, "⚠️ El asistente inteligente no está configurado. Define `GEMINI_API_KEY` en Render.");
  }

  try {
    bot.sendChatAction(chatId, 'typing');
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Eres un asistente virtual carismático y amigable para una pareja a distancia. Responde esta duda: ${duda}`
    });

    bot.sendMessage(chatId, `🤖 *Respuesta:* \n\n${response.text}`, { parse_mode: 'Markdown' });
  } catch (error) {
    console.error("Error al consultar Gemini:", error);
    bot.sendMessage(chatId, "Ups, ocurrió un error al consultar la respuesta.");
  }
});

console.log('¡Bot actualizado y listo con 23+ nuevas funciones! 🤖🎉');