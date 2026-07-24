const http = require('http');
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

// --- BANCOS DE DATOS Y MEMORIA ---
const capsulasTiempo = [];
const metasPareja = [];
const listaPelis = [];
const pelisVistas = [];
let puntosPareja = 0;

const razonesAmor = [
    "Me encanta cómo me haces sonreír incluso en los días más difíciles.",
    "Amo la forma en que tu voz me da paz instantánea.",
    "Porque contigo la distancia se siente más corta.",
    "Amo tu sentido del humor y cómo nos reímos de cualquier tontería.",
    "Porque eres mi lugar seguro en el mundo.",
    "Amo cómo cuidas de mí a pesar de los kilómetros.",
    "Porque cada día a tu lado es una nueva aventura."
];

const apodosCoquetos = [
    "Mi terroncito de azúcar 🍯", "Cielo hermoso 🌟", "Mi rey/reina 👑", 
    "Mi cómplice favorito/a 😉", "Mi cosita linda 🧸", "Mi amor bonito 💖"
];

const cuponesAmor = [
    "🎟️ *CUPÓN:* Vale por una llamada nocturna hasta dorminos 💤",
    "🎟️ *CUPÓN:* Vale por elegir la película de la próxima cita 🍿",
    "🎟️ *CUPÓN:* Vale por cumplir un capricho o reto sin rechistar 🙈",
    "🎟️ *CUPÓN:* Vale por un masaje virtual / mimos infinitos 🫂"
];

const preguntasIncognitas = [
    "🫣 ¿Qué fue lo primero que pensaste cuando viste mi foto por primera vez?",
    "🫣 Si estuviéramos en la misma habitación ahora mismo, ¿qué haríamos?",
    "🫣 ¿Qué es lo que más te pone nervioso/a de mí?"
];

const desafiosSensuales = [
    "🔥 Manda una foto donde muestres tu mejor ángulo coqueto.",
    "🔥 Manda una nota de voz susurrando qué me harías si estuviera ahí.",
    "🔥 Haz una pose atrevida en la próxima videollamada por 10 segundos."
];

const recomendacionPelis = [
    "🍿 *Amor a segunda vista* (Romance/Comedia)",
    "🍿 *Your Name* (Anime/Romance)",
    "🍿 *Inception* (Ciencia Ficción/Suspenso)",
    "🍿 *La La Land* (Musical/Romance)"
];

// --- MENÚ PRINCIPAL ---
bot.onText(/\/start/, (msg) => {
    const opciones = {
        reply_markup: {
            keyboard: [
                ['🎮 Calendario LDR', '🌍 Hora y Clima'],
                ['🥺 Te Extraño', '📹 Pase a Videollamada'],
                ['🫂 Beso / Abrazo', '✨ Apodo Coquetón'],
                ['💖 100 Razones', '🎟️ Cupones de Amor'],
                ['🎲 Dado Picante', '🔥 Verdad / Reto'],
                ['📋 Comandos de Juegos', '📌 Comandos de Pareja']
            ],
            resize_keyboard: true
        }
    };
    bot.sendMessage(msg.chat.id, "¡Llegó el mega bot con todas tus opciones integradas! 🤖❤️", opciones);
});

// --- MENÚS DE AYUDA SECUNDARIOS ---
bot.onText(/📋 Comandos de Juegos/, (msg) => {
    const txt = `🎲 **JUEGOS Y DIVERSIÓN DISPONIBLES:**\n\n` +
                `• /volado - Dado Mágico o Volado.\n` +
                `• /aventura - Elige Tu Propia Aventura.\n` +
                `• /testpareja - Test de Pareja Rápido.\n` +
                `• /dadopicante - Dado con retos zarpados.\n` +
                `• /desafio - Desafío Sensual del día.\n` +
                `• /adivina - Adivina la Canción o Frase.\n` +
                `• /meme - Adivina el Meme.\n` +
                `• /3verdades - Juego de 3 Verdades y 1 Mentira.\n` +
                `• /compatibilidad - Test de Compatibilidad Diario.`;
    bot.sendMessage(msg.chat.id, txt, { parse_mode: 'Markdown' });
});

bot.onText(/📌 Comandos de Pareja/, (msg) => {
    const txt = `📌 **HERRAMIENTAS DE PAREJA:**\n\n` +
                `• /capsula [mensaje] - Guardar secreto en cápsula.\n` +
                `• /vercapsula - Ver cápsula del tiempo.\n` +
                `• /meta [meta] - Agregar meta en pareja.\n` +
                `• /vermetas - Ver metas guardadas.\n` +
                `• /estado [estado] - Publicar estado de ánimo.\n` +
                `• /confesion [mensaje] - Confesión secreta.\n` +
                `• /puntos - Ver marcador de puntos.\n` +
                `• /puntosmas - Sumar punto a la pareja.\n` +
                `• /convertir [monto] [mxn/ves] - Convertir moneda.\n` +
                `• /peli [nombre] - Guardar peli por ver.\n` +
                `• /vistas - Ver pelis completadas.`;
    bot.sendMessage(msg.chat.id, txt, { parse_mode: 'Markdown' });
});

// --- LÓGICA DE MENSAJES Y RESPUESTAS ---
bot.on('message', (msg) => {
    if (!msg.text) return;
    const chatId = msg.chat.id;
    const texto = msg.text.trim();
    const textoLower = texto.toLowerCase();

    // HORARIOS
    if (texto === '🌍 Hora y Clima' || texto === '/clima') {
        const ahora = new Date();
        const horaMX = ahora.toLocaleTimeString('es-MX', { timeZone: 'America/Mexico_City', hour: '2-digit', minute: '2-digit', hour12: true });
        const horaVE = ahora.toLocaleTimeString('es-VE', { timeZone: 'America/Caracas', hour: '2-digit', minute: '2-digit', hour12: true });
        bot.sendMessage(chatId, `🌍 *HORARIOS A DISTANCIA*\n\n🇲🇽 **México:** ${horaMX}\n🇻🇪 **Venezuela:** ${horaVE}`, { parse_mode: 'Markdown' });
    }

    // BOTONES RÁPIDOS
    if (texto === '🥺 Te Extraño' || texto === '/teextrano') {
        bot.sendMessage(chatId, `📢 *ALERTA DE AMOR:* ¡Tu pareja te está extrañando muchísimo en este momento! ❤️🥺`, { parse_mode: 'Markdown' });
    }

    if (texto === '📹 Pase a Videollamada' || texto === '/llamada') {
        bot.sendMessage(chatId, `🚨 *ALERTA:* ¡Solicitud de Videollamada Urgente! Conéctense cuando puedan 📱✨`, { parse_mode: 'Markdown' });
    }

    if (texto === '🫂 Beso / Abrazo' || texto === '/abrazo' || texto === '/beso') {
        const op = Math.random() < 0.5 ? "🫂 *Te envío un abrazo apretadísimo a la distancia.*" : "💋 *Te envío un beso tronado y con mucho cariño.*";
        bot.sendMessage(chatId, op, { parse_mode: 'Markdown' });
    }

    if (texto === '✨ Apodo Coquetón' || texto === '/apodo') {
        const ap = apodosCoquetos[Math.floor(Math.random() * apodosCoquetos.length)];
        bot.sendMessage(chatId, `✨ Hoy te nombró: **${ap}**`, { parse_mode: 'Markdown' });
    }

    if (texto === '💖 100 Razones' || texto === '/razones') {
        const r = razonesAmor[Math.floor(Math.random() * razonesAmor.length)];
        bot.sendMessage(chatId, `💖 *Razón para quererte:* ${r}`, { parse_mode: 'Markdown' });
    }

    if (texto === '🎟️ Cupones de Amor' || texto === '/cupon') {
        const c = cuponesAmor[Math.floor(Math.random() * cuponesAmor.length)];
        bot.sendMessage(chatId, c, { parse_mode: 'Markdown' });
    }

    if (texto === '🎲 Dado Picante' || texto === '/dadopicante') {
        const d = Math.floor(Math.random() * 6) + 1;
        const retos = {
            1: "🌶️ Manda una foto provocativa.",
            2: "🎙️ Nota de voz susurrando algo íntimo.",
            3: "💬 Haz una pregunta sin censura al otro.",
            4: "🎥 Video corto mandando un beso coqueto.",
            5: "👑 Eliges un castigo picante para el otro.",
            6: "🔥 ¡Comodín libre! Pide el reto que quieras."
        };
        bot.sendMessage(chatId, `🎲 *DADO PICANTE cayó en ${d}:*\n\n${retos[d]}`, { parse_mode: 'Markdown' });
    }

    // COMANDOS INTERACTIVOS ADICIONALES
    if (texto === '/aventura') {
        bot.sendMessage(chatId, "📖 *Elige tu aventura:* ¿Prefieren una noche de horror en llamada (Opción A) o torneo de juegos (Opción B)?", { parse_mode: 'Markdown' });
    }

    if (texto === '/testpareja') {
        bot.sendMessage(chatId, "🧪 *Test Rápido:* ¿Quién es más probable que se quede dormido en videollamada primero? 😴", { parse_mode: 'Markdown' });
    }

    if (texto === '/compatibilidad') {
        const porc = Math.floor(Math.random() * 20) + 81; // Entre 81% y 100%
        bot.sendMessage(chatId, `💘 *Nivel de Compatibilidad de Hoy:* ¡**${porc}%**! Están súper conectados.`, { parse_mode: 'Markdown' });
    }

    if (texto === '/desafio') {
        const des = desafiosSensuales[Math.floor(Math.random() * desafiosSensuales.length)];
        bot.sendMessage(chatId, des, { parse_mode: 'Markdown' });
    }

    if (texto === '/incognita') {
        const inc = preguntasIncognitas[Math.floor(Math.random() * preguntasIncognitas.length)];
        bot.sendMessage(chatId, inc, { parse_mode: 'Markdown' });
    }

    if (texto.startsWith('/estado ')) {
        const est = texto.replace('/estado ', '');
        bot.sendMessage(chatId, `😊 *Estado de ánimo actualizado:* "${est}"`, { parse_mode: 'Markdown' });
    }

    if (texto.startsWith('/confesion ')) {
        const conf = texto.replace('/confesion ', '');
        bot.sendMessage(chatId, `🤫 *CONFESIÓN SECRETA:* \n\n"${conf}"`, { parse_mode: 'Markdown' });
    }

    if (texto === '/puntos') {
        bot.sendMessage(chatId, `📍 *Buscador de Puntos:* Llevan **${puntosPareja}** puntos amorosos acumulados. 🏆`, { parse_mode: 'Markdown' });
    }

    if (texto === '/puntosmas') {
        puntosPareja += 1;
        bot.sendMessage(chatId, `🎉 ¡Punto sumado! Ahora tienen **${puntosPareja}** puntos.`, { parse_mode: 'Markdown' });
    }

    // CONVERSOR DE MONEDAS
    if (texto.startsWith('/convertir ')) {
        const partes = texto.split(' ');
        const monto = parseFloat(partes[1]);
        const tipo = partes[2] ? partes[2].toLowerCase() : 'mxn';

        if (!isNaN(monto)) {
            if (tipo === 'mxn') {
                const res = (monto * 2.1).toFixed(2); // Tasa de ejemplo referencial
                bot.sendMessage(chatId, `💱 **${monto} MXN** equivale aprox a **${res} VES** (Bolívares).`);
            } else {
                const res = (monto / 2.1).toFixed(2);
                bot.sendMessage(chatId, `💱 **${monto} VES** equivale aprox a **${res} MXN** (Pesos).`);
            }
        }
    }

    // RESPUESTAS AUTOMÁTICAS DIVERTIDAS
    if (textoLower === 'hola' || textoLower === 'buenas') {
        bot.sendMessage(chatId, "¡Hola hermoso/a! 👋❤️");
    } else if (textoLower.includes('te amo')) {
        bot.sendMessage(chatId, "¡El amor está en el aire! 🥰💖");
    } else if (textoLower.includes('tengo hambre')) {
        bot.sendMessage(chatId, "🍕 ¡Hora de pedir la cena juntos en llamada!");
    }
});

console.log('¡Mega Bot completamente cargado y activo! 🤖🎉');