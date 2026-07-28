const { GoogleGenerativeAI } = require('@google/generative-ai');
const axios = require('axios');
const http = require('http');
const TelegramBot = require('node-telegram-bot-api').default || require('node-telegram-bot-api');
const { GoogleGenAI } = require('@google/genai');

let ai;

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
let genAI;
if (GEMINI_API_KEY) {
    genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
}
const bot = new TelegramBot(token, { polling: true });


// --- BASES DE DATOS EN MEMORIA (ALMACENAMIENTO DE DATOS) ---
const capsuleStorage = [];     // Cápsula del tiempo / Buzón
const metasStorage = [];       // Metas y Deseos
const seriesVistasStorage = [];// Registro de series vistas
const userPoints = {};         // Buscador de Puntos

// --- FUNCIÓN MEJORADA DE DADO Y VOLADO ---
function lanzarDadoYVolado() {
    const carasMoneda = ["🪙 **Cara**", "🪙 **Cruz**"];
    const resultadoMoneda = carasMoneda[Math.floor(Math.random() * carasMoneda.length)];
    const dado = Math.floor(Math.random() * 6) + 1;
    
    return `🎲 *LANZAMIENTO MÁGICO / VOLADO* 🎲\n\n` +
           `• **Resultado del Volado:** ${resultadoMoneda}\n` +
           `• **Resultado del Dado (1-6):** 🎲 **${dado}**`;
}

// --- CALENDARIO DINÁMICO A DISTANCIA ---
function obtenerCalendarioHoy() {
    const ahora = new Date();
    const inicioAño = new Date(ahora.getFullYear(), 0, 1);
    const dias = Math.floor((ahora - inicioAño) / (24 * 60 * 60 * 1000));
    const numeroSemana = Math.ceil((dias + inicioAño.getDay() + 1) / 7);
    const diaSemana = ahora.getDay();

    // Rota cíclicamente entre 0, 1, 2, 3 y 4 (Semanas A, B, C, D y E)
    const indiceSemana = numeroSemana % 5;

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

    const calendarioC = {
        1: "🧠 *Lunes:* Competencia de Trivia y Test de Pareja 💡",
        2: "🎨 *Martes:* Pintar o Dibujar juntos en Gartic Phone / Skribbl 🖌️",
        3: "🎮 *Miércoles:* Roblox / Juegos Co-op en llamada 👾",
        4: "🎧 *Jueves:* Escuchar música juntos en Spotify / Discord 🎶",
        5: "🔥 *Viernes:* Noche de Retos Picantes en videollamada 😈",
        6: "🔫 *Sábado:* Free Fire Nocturno + Charlas de medianoche 🌌",
        0: "🧸 *Domingo:* Plan relax: Ver videos graciosos de TikTok/YouTube 📱"
    };

    const calendarioD = {
        1: "🕹️ *Lunes:* Juegos retro o de minijuegos online 🎮",
        2: "🎯 *Martes:* Torneo exprés de Parchís y Castigos 🎲",
        3: "🎤 *Miércoles:* Noche de Karaoke en videollamada 🎶",
        4: "🎬 *Jueves:* Ver un documental o película de misterio 🕵️‍♂️",
        5: "🍷 *Viernes:* '¿Qué prefieres?' Picante + Tragos/Refrescos 🥂",
        6: "💥 *Sábado:* Free Fire - Torneo de Parejas 🏆",
        0: "💌 *Domingo:* Lectura de cartas / Recordar anécdotas juntos 📜"
    };

    const calendarioE = {
        1: "🎴 *Lunes:* UNO! versión extrema en llamada 🃏",
        2: "☕ *Martes:* Cita de café virtual por la tarde / noche ☕",
        3: "🧩 *Miércoles:* Armar rompecabezas o sopas de letras online 🧩",
        4: "🍿 *Jueves:* Noche de Películas de Terror / Suspenso 🎃",
        5: "🌶️ *Viernes:* Adivina la canción + Ruleta de castigos 🎵",
        6: "🔫 *Sábado:* Noche libre de Free Fire y chisme 🗣️",
        0: "💤 *Domingo:* Videollamada chill sin hablar, solo compañía ☁️"
    };

    const calendarios = [calendarioA, calendarioB, calendarioC, calendarioD, calendarioE];
    const etiquetas = ["Semana A", "Semana B", "Semana C", "Semana D", "Semana E"];

    const tipoSemana = etiquetas[indiceSemana];
    const juegoHoy = calendarios[indiceSemana][diaSemana];

    return `🗓️ *CALENDARIO A DISTANCIA* (${tipoSemana})\n\n👉 *Hoy toca:* \n${juegoHoy}\n\n_(Rota automáticamente cada 5 semanas para romper la rutina)_`;
}
// --- BANCOS DE DATOS Y NUEVAS FUNCIONES ---
const modoImitacion = [
    "🎭 *Reto de Imitación (2 Minutos):*\nAmbos deben hablar en la llamada usando un **acento dramático de telenovela**.",
    "🎭 *Reto de Imitación (2 Minutos):*\nTienen que responder a todo lo que diga el otro susurrando como si fuera un **secreto confidencial**.",
    "🎭 *Reto de Imitación (2 Minutos):*\nDeben hablar imitando el tono de un **locutor de radio o presentador de noticias**.",
    "🎭 *Reto de Imitación (2 Minutos):*\nCada uno debe imitar la forma de hablar y los gestos del **otro** (¡a ver qué tan bien se conocen!).",
    "🎭 *Reto de Imitación (2 Minutos):*\nHablen como si fueran dos **villanos de película** planeando apoderarse del mundo.",
    "🎭 *Reto de Imitación:* Imita a un cantante de reguetón famoso (Anuel, Bad Bunny o Feid) diciendo una frase típica con su voz y muletillas. 🎤👹",

    "🎭 *Reto de Imitación:* Imita la forma en que la otra persona se queja o hace un berrinche tierno cuando algo no le sale bien. 🥺🎬",

    "🎭 *Reto de Imitación:* Imita a un narrador de partidos de fútbol muy emocionado relatando cómo te sirves un vaso de agua. 🎙️⚽",

    "🎭 *Reto de Imitación:* Haz la imitación de una alarma de teléfono súper ruidosa y molesta durante 10 segundos por audio o llamada. ⏰🔊",

    "🎭 *Reto de Imitación:* Imita a un vendedor ambulante de calle vendiendo verduras o fruta a todo pulmón. 🍎🗣️",

    "🎭 *Reto de Imitación:* Ponte en modo villano/a de película animada y explica tu plan malvado para dominar el mundo. 🦹‍♂️🌍",

    "🎭 *Reto de Imitación:* Imita a un presentador/a de noticias dando la noticia de última hora de que te mueres por ver a la otra persona. 📺📰",

    "🎭 *Reto de Imitación:* Haz la imitación del sonido de un motor de auto viejo que no quiere encender. 🚗💨",

    "🎭 *Reto de Imitación:* Imita a una mamá enojada regañando a su hijo porque no ha ordenado el cuarto. 🧹😠",

    "🎭 *Reto de Imitación:* Imita a Bob Esponja riéndote exactamente igual que él durante 15 segundos seguidos. 🧽🪸",

    "🎭 *Reto de Imitación:* Ponte en papel de fantasma dramático intentando asustar a la otra persona por nota de voz. 👻🕸️",

    "🎭 *Reto de Imitación:* Imita a un gato consentido pidiendo comida desesperadamente. 🐱🐾",

    "🎭 *Reto de Imitación:* Imita a un profesor/a aburrido/a dando una clase sobre la historia del amor a las 7 de la mañana. 👨‍🏫📐",

    "🎭 *Reto de Imitación:* Imita el llanto exagerado de telenovela dramática porque se te cayó la comida al suelo. 🎭😭",

    "🎭 *Reto de Imitación:* Imita el sonido de una sirena de policía o ambulancia con la boca durante 10 segundos. 🚨🔊",

    "🎭 *Reto de Imitación:* Imita a un robot al que se le está acabando la batería a mitad de un mensaje importante. 🤖🔋",

    "🎭 *Reto de Imitación:* Haz la imitación de un perro ladrándole a la puerta porque escuchó el timbre. 🐶🚪",

    "🎭 *Reto de Imitación:* Imita a un GPS desorientado dándole indicaciones locas a la otra persona para llegar a tu corazón. 🗺️🚗",

    "🎭 *Reto de Imitación:* Imita a un locutor de radio romántica de medianoche dedicándole un poema a la otra persona. 🎙️🌙",

    "🎭 *Reto de Imitación:* Imita la risa de un bebé o la cara que pones cuando estás buscando que te consientan. 👶🥺"
];

const preguntasProfundas = [
    "💬 *Pregunta Nocturna:*\n¿Qué es algo que nunca le has contado a nadie sobre tu infancia?",
    "💬 *Pregunta Nocturna:*\n¿Cuál ha sido el momento en el que te has sentido más orgulloso/a de ti mismo/a?",
    "💬 *Pregunta Nocturna:*\nSi pudieras cambiar una sola decisión de tu pasado, ¿cuál sería?",
    "💬 *Pregunta Nocturna:*\n¿Qué es lo que más valoras de la forma en que nos llevamos tú y yo?",
    "💬 *Pregunta Nocturna:*\n¿Cuál es tu mayor sueño o meta por cumplir este año?",
    "💭 *Pregunta Nocturna:*\n¿Qué es lo primero que harías si despiertas mañana y estoy al lado tuyo?",
    "💭 *Pregunta Nocturna:*\n¿Cuál es esa cualidad mía que te hace sentir seguro/a cuando hablamos?",
    "💭 *Pregunta Nocturna:*\n¿Qué palabra o frase que uso te da risa o ternura cada vez que la digo?",
    "💭 *Pregunta Nocturna:*\n¿Hay algún aroma o olor en particular que te traiga un recuerdo muy feliz?",
    "💭 *Pregunta Nocturna:*\n¿Qué es algo que te gustaría que hagamos juntos en nuestra primera noche juntos?",
    "💭 *Pregunta Nocturna:*\nSi pudieras viajar en el tiempo a cuando tenías 10 años, ¿qué consejo te darías?",
    "💭 *Pregunta Nocturna:*\n¿Qué es lo que más te gusta de nuestra rutina nocturna al despedirnos?",
    "💭 *Pregunta Nocturna:*\n¿Cuál ha sido la foto o video mío que más te ha hecho sonreír recientemente?",
    "💭 *Pregunta Nocturna:*\n¿Qué comida o postre sientes que te reconforta el alma cuando tienes un día pesado?",
    "💭 *Pregunta Nocturna:*\n¿De qué manera sientes que ha cambiado tu perspectiva del amor desde que estamos juntos?",
    "💭 *Pregunta Nocturna:*\n¿Cuál es ese pequeño logro personal de esta semana del que casi no le contaste a nadie?",
    "💭 *Pregunta Nocturna:*\nSi pudieras regalarme cualquier cosa en el mundo sin importar el precio, ¿qué me darías?",
    "💭 *Pregunta Nocturna:*\n¿Qué es algo en lo que sientes que nos parecemos muchísimo y no nos habíamos dado cuenta?",
    "💭 *Pregunta Nocturna:*\n¿Cuál es tu lugar favorito para estar a solas cuando necesitas pensar?",
    "💭 *Pregunta Nocturna:*\n¿Qué tipo de detalles te hacen sentir la persona más cuidada y querida del mundo?",
    "💭 *Pregunta Nocturna:*\n¿Hay algún libro, película o serie que sientas que definió un antes y un después en tu vida?",
    "💭 *Pregunta Nocturna:*\n¿Qué es lo que más te emociona cuando piensas en nuestro futuro a largo plazo?",
    "💭 *Pregunta Nocturna:*\n¿Cuál ha sido el piropo o cumplido más lindo que te he dicho?",
    "💭 *Pregunta Nocturna:*\n¿Qué es algo que te da mucha curiosidad saber sobre mí pero nunca te has atrevido a preguntar?",
    "💭 *Pregunta Nocturna:*\n¿Cómo describirías la paz en una sola imagen o momento?",
    "💭 *Pregunta Nocturna:*\n¿Qué canción pondrías para dar un paseo nocturno en auto conmigo?",
    "💭 *Pregunta Nocturna:*\n¿Cuál ha sido un momento gracioso o vergonzoso de una videollamada nuestra que recuerdes?",
    "💭 *Pregunta Nocturna:*\n¿Qué habilidad te gustaría aprender si tuvieras todo el tiempo libre del mundo?",
    "💭 *Pregunta Nocturna:*\n¿Qué rasgo físico mío te llama más la atención cuando me ves en pantalla?",
    "💭 *Pregunta Nocturna:*\n¿Qué significa para ti que alguien realmente esté presente para ti en los malos momentos?",
    "💭 *Pregunta Nocturna:*\nSi pudieras elegir el clima perfecto para nuestra primera cita, ¿sería lluvioso, soleado o frío?",
    "💭 *Pregunta Nocturna:*\n¿Qué hábito o costumbre te gustaría que construyamos juntos cuando vivamos cerca?",
    "💭 *Pregunta Nocturna:*\n¿Cuál es un sueño loco o fuera de lo común que has tenido recientemente?",
    "💭 *Pregunta Nocturna:*\n¿Qué es lo que más te ayuda a conciliar el sueño cuando tu mente no para de pensar?",
    "💭 *Pregunta Nocturna:*\n¿Qué mensaje de voz o texto mío guardas o relees cuando me extrañas mucho?"
];

const ruletaCastigosLlamada = [
    "🎰 *Castigo:* Debes cantar el coro de una canción de reguetón con voz de bebé hasta que termine el verso. 🎤👶",

    "🎰 *Castigo:* Debes mantener los ojos cerrados durante los próximos 3 minutos de llamada sin trampas. 🙈⏱️",

    "🎰 *Castigo:* Tienes que hablar con acento extranjero (español, argentino, mexicano, etc.) por los próximos 5 minutos. 🎭🗣️",

    "🎰 *Castigo:* Tienes que susurrarle al micrófono 3 cosas que te encantan de la otra persona como si fuera un secreto. 🎙️🤫",

    "🎰 *Castigo:* Haz 15 abdominales o sentadillas mientras sigues hablando por la llamada. 🏋️‍♂️💦",

    "🎰 *Castigo:* Debes responder a todo lo que te digan durante los próximos 2 minutos diciendo únicamente 'Sí, mi amor'. 🤐❤️",

    "🎰 *Castigo:* Tómate una foto graciosa con filtro y ponla de perfil por 1 hora. 📷🤪",

    "🎰 *Castigo:* Canta el coro de una canción romántica mirando a la cámara en llamada. 🎤❤️",

    "🎰 *Castigo:* Escribe una mini carta de amor de 3 líneas y léela en voz alta. 💭📜",

    "🎰 *Castigo:* Haz un baile gracioso de 10 segundos en videollamada. 💃🕺",

    "🎰 *Castigo:* Mantén una mueca rara durante 30 segundos sin reírte. 🤪⏱️",

    "🎰 *Castigo:* Debes confesar cuál fue el pensamiento más coqueto o atrevido que tuviste hoy. 😳😈",

    "🎰 *Castigo:* Pon la llamada en altavoz y dale un beso súper ruidoso y exagerado a la pantalla/teléfono. 💋📱",

    "🎰 *Castigo:* Tienes que contar un chiste malo o una historia graciosa; si no produce risa, debes cumplir otro castigo. 🤡😂",

    "🎰 *Castigo:* Tienes que dedicarle una serenata improvisada inventando la letra en el momento. 🎸🎤",

    "🎰 *Castigo:* Cambia tu nombre de contacto en su WhatsApp por el apodo cursi que la otra persona elija durante 24 horas. 📱🏷️",

    "🎰 *Castigo:* Tienes que maullar como un gatito consentido cada vez que vayas a hablar por los próximos 2 minutos. 🐱🐾",

    "🎰 *Castigo:* Muestra lo primero que tengas a la mano en tu habitación y explícale con voz dramática por qué es súper vital para tu vida. 🎭📦",

    "🎰 *Castigo:* Mándale una nota de voz de 15 segundos diciendo solo halagos seguidos sin parar a respirar. 🎙️💨",

    "🎰 *Castigo:* Colócate una prenda en la cabeza (una franela, gorro o almohada) y déjatela puesta 5 minutos. 🧢🛋️",

    "🎰 *Castigo:* Debes imitar el sonido de 3 animales diferentes y la otra persona tiene que adivinarlos. 🦁🐶🐸",

    "🎰 *Castigo:* Quédate completamente congelado/a en la posición en la que estés durante 45 segundos como si se hubiera pausado el internet. 🥶⏱️",

    "🎰 *Castigo:* Di 5 trabalenguas o frases difíciles seguidas sin equivocarte; si se te traba la lengua, vuelves a empezar. 👅📜",

    "🎰 *Castigo:* Promete y agenda desde ya la comida o postre que le vas a invitar la primera vez que se vean en persona. 🍨🍕"

];

const triviasDistancia = [
    "🧠 *Trivia LDR:*\n\n¿Sabes cuál es la hora exacta en la que suelo estar más libre para hablar?",
    "🧠 *Trivia LDR:*\n\n¿Recuerdas cuál fue la primera foto que nos enviamos por chat?",
    "🧠 *Trivia LDR:*\n\n¿Qué juego es en el que más te gusta ganarme en llamada?",
    "🧠 *Trivia LDR:*\n\n¿Cuál es la prenda de vestir mía que más te gusta cuando me ves en cámara?",
     "🧠 *Trivia:* ¿Cuál es el océano más grande y profundo del planeta Tierra?\n\n*A)* Océano Atlántico\n*B)* Océano Pacífico\n*C)* Océano Índico\n*D)* Océano Ártico",
"🧠 *Trivia:* ¿En qué país nació el creador de la famosa Mona Lisa, Leonardo da Vinci?\n\n*A)* Francia\n*B)* España\n*C)* Italia\n*D)* Grecia",

    "🧠 *Trivia:* ¿Cuál es el planeta más cercano al Sol en nuestro sistema solar?\n\n*A)* Venus\n*B)* Mercurio\n*C)* Marte\n*D)* Júpiter",

    "🧠 *Trivia:* ¿En qué año llegó el hombre a la Luna por primera vez?\n\n*A)* 1969\n*B)* 1975\n*C)* 1958\n*D)* 1980",

    "🧠 *Trivia:* ¿Qué animal es conocido por ser el mamífero más grande de todo el mundo?\n\n*A)* Elefante africano\n*B)* Ballena azul\n*C)* Tiburón ballena\n*D)* Girafa",

    "🧠 *Trivia:* ¿Cuál es el país con mayor población de todo el planeta?\n\n*A)* Estados Unidos\n*B)* Rusia\n*C)* India\n*D)* China",

    "🧠 *Trivia:* ¿Cómo se llama el metal líquido a temperatura ambiente?\n\n*A)* Hierro\n*B)* Mercurio\n*C)* Aluminio\n*D)* Cobre",

    "🧠 *Trivia:* ¿En qué famosa película de Disney sale la canción 'Bajo el mar'?\n\n*A)* La Sirenita\n*B)* Moana\n*C)* Buscando a Nemo\n*D)* Lilo y Stitch",

    "🧠 *Trivia:* ¿Cuál es la capital del país de Francia?\n\n*A)* Roma\n*B)* Madrid\n*C)* París\n*D)* Berlín",

    "🧠 *Trivia:* ¿Cuál de estos órganos es el encargando de bombear la sangre por todo el cuerpo?\n\n*A)* Pulmón\n*B)* Hígado\n*C)* Corazón\n*D)* Estómago",

    "🧠 *Trivia:* ¿Qué idioma es el más hablado en todo el continente de Sudamérica?\n\n*A)* Español\n*B)* Portugués\n*C)* Inglés\n*D)* Francés",

    "🧠 *Trivia:* ¿Cuántos huesos tiene el cuerpo humano de un adulto en total?\n\n*A)* 206\n*B)* 300\n*C)* 150\n*D)* 212",

    "🧠 *Trivia:* ¿Cuál es la montaña o pico más alto de todo el mundo?\n\n*A)* Monte Kilimanjaro\n*B)* Monte Everest\n*C)* Mont Blanc\n*D)* K2",

    "🧠 *Trivia:* ¿Quién escribió la famosísima obra literaria 'Don Quijote de la Mancha'?\n\n*A)* Gabriel García Márquez\n*B)* Miguel de Cervantes\n*C)* William Shakespeare\n*D)* Pablo Neruda",

    "🧠 *Trivia:* ¿Qué color resulta de mezclar el color Azul con el Amarillo?\n\n*A)* Morado\n*B)* Naranja\n*C)* Verde\n*D)* Marrón",

    "🧠 *Trivia:* ¿En qué deporte se utiliza la palabra 'KO' o 'Knockout'?\n\n*A)* Fútbol\n*B)* Baloncesto\n*C)* Boxeo\n*D)* Tenis",

    "🧠 *Trivia:* ¿Cuál es el tercer planeta partiendo desde el Sol?\n\n*A)* Marte\n*B)* Tierra\n*C)* Venus\n*D)* Saturno",

    "🧠 *Trivia:* ¿Qué instrumento musical tiene cuerdas, trastes y se toca mucho en el rock y reguetón?\n\n*A)* Piano\n*B)* Batería\n*C)* Guitarra\n*D)* Flauta",

    "🧠 *Trivia:* ¿Cuál es la fruta que tiene sus semillas por fuera?\n\n*A)* Manzana\n*B)* Fresa / Frutilla\n*C)* Plátano / Banano\n*D)* Uva",

    "🧠 *Trivia:* Pregunta para los dos: ¿Quién de los dos tarda más tiempo en alistarse o arreglarse para salir?\n\n*A)* Tú\n*B)* Yo\n*C)* Los dos por igual",
    "🧠 *Trivia LDR:*\n\n¿Recuerdas cuál fue la primera foto que nos enviamos por chat?",
    "🧠 *Trivia LDR:*\n\n¿Qué juego es en el que más te gusta ganarme en llamada?",
    "🧠 *Trivia LDR:*\n\n¿Cuál es la prenda de vestir mía que más te gusta cuando me ves en cámara?",
    "🧠 *Trivia LDR:*\n\n¿Cuál fue el primer apodo cariñoso o tierno que nos pusimos?",
    "🧠 *Trivia LDR:*\n\n¿Qué es lo primero que dijiste o pensaste de mí la primera vez que escuchaste mi voz?",
    "🧠 *Trivia LDR:*\n\n¿Qué hora exacta marca el reloj cuando nos decimos buenas noches casi siempre?",
    "🧠 *Trivia LDR:*\n\n¿Cuál de nuestras canciones o audios te gusta volver a escuchar cuando me extrañas?",
    "🧠 *Trivia LDR:*\n\nSi pudieras elegir cualquier ciudad del mundo para nuestro primer viaje juntos, ¿cuál sería?",
    "🧠 *Trivia LDR:*\n\n¿Recuerdas qué estábamos haciendo o de qué hablábamos la primera vez que nos quedamos despiertos hasta tarde?",
    "🧠 *Trivia LDR:*\n\n¿Cuál es mi comida favorita que siempre digo que te voy a preparar cuando nos veamos?",
    "🧠 *Trivia LDR:*¿Cuál es el océano más grande y profundo del planeta Tierra?\n\nA) Océano Atlántico\nB) Océano Índico\nC) Océano Pacífico\nD) Océano Ártico",
    "🧠 *Trivia LDR:* ¿En qué país nació el creador de la famosa Mona Lisa, Leonardo da Vinci?\n\nA) Francia\nB) Italia\nC) España\nD) Grecia",
    "🧠 *Trivia LDR:* ¿Cuál es el planeta más cercano al Sol en nuestro sistema solar?\n\nA) Venus\nB) Marte\nC) Mercurio\nD) Júpiter",
    "🧠 *Trivia LDR:* ¿En qué año llegó el hombre a la Luna por primera vez?\n\nA) 1969\nB) 1975\nC) 1958\nD) 1980",
    "🧠 *Trivia LDR:* ¿Qué animal es conocido por ser el mamífero más grande de todo el mundo?\n\nA) Elefante Africano\nB) Ballena Azul\nC) Tiburón Ballena\nD) Jirafa",
    "🧠 *Trivia LDR:* ¿Cuál es el país con mayor población de todo el planeta?\n\nA) Estados Unidos\nB) India\nC) China\nD) Brasil",
    "🧠 *Trivia LDR:* ¿Cómo se llama el metal líquido a temperatura ambiente?\n\nA) Hierro\nB) Mercurio\nC) Cobre\nD) Aluminio",
    "🧠 *Trivia LDR:* ¿En qué famosa película de Disney sale la canción 'Bajo el mar'?\n\nA) La Sirenita\nB) Aladdín\nC) Moana\nD) Hércules",
    "🧠 *Trivia LDR:* ¿Cuál es la capital del país de Francia?\n\nA) Roma\nB) Madrid\nC) París\nD) Londres",
    "🧠 *Trivia LDR:* ¿Cuál de estos órganos es el encargado de mecer y bombear la sangre por todo el cuerpo?\n\nA) Pulmones\nB) Cerebro\nC) Corazón\nD) Hígado",
    "🧠 *Trivia LDR:* ¿Qué idioma es el más hablado en todo el continente de Sudamérica?\n\nA) Español\nB) Portugués\nC) Inglés\nD) Francés",
    "🧠 *Trivia LDR:* ¿Cuántos huesos tiene el cuerpo humano de un adulto en total?\n\nA) 206\nB) 300\nC) 150\nD) 500",
    "🧠 *Trivia LDR:* ¿Cuál es la montaña o pico más alto de todo el mundo?\n\nA) Monte Kilimanjaro\nB) Monte Everest\nC) Los Alpes\nD) Monte Fuji",
    "🧠 *Trivia LDR:* ¿Quién escribió la famosísima obra literaria 'Don Quijote de la Mancha'?\n\nA) Gabriel García Márquez\nB) Miguel de Cervantes\nC) William Shakespeare\nD) Pablo Neruda",
    "🧠 *Trivia LDR:* ¿Qué color resulta de mezclar el color Azul con el Amarillo?\n\nA) Morado\nB) Verde\nC) Naranja\nD) Marrón",
    "🧠 *Trivia LDR:* ¿En qué deporte se utiliza la palabra 'KO' o 'Knockout'?\n\nA) Fútbol\nB) Baloncesto\nC) Boxeo\nD) Tenis"
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
      "🤔 *¿Qué Prefieres?*\n1. ¿Poder leer mis pensamientos por un solo día completo?\n2. ¿Poder borrar de mi mente un recuerdo tonto o vergonzoso tuyo?\n\n¿Cuál eliges y por qué? 🧠💭",

    "🤔 *¿Qué Prefieres?*\n1. ¿Tener una cita romántica perfecta en la playa al atardecer?\n2. ¿Una noche entera de pizzas, películas y mimitos enrollados en una cobija?\n\n¿Cuál eliges? 🏖️ vs 🍕",

    "🤔 *¿Qué Prefieres?*\n1. ¿Que no podamos hablar por llamadas durante toda una semana (solo texto)?\n2. ¿Que no podamos mandar ni un solo mensaje de texto por una semana (solo audio/llamadas)?\n\n¿Cuál prefieres aguantar? 📱🎙️",

    "🤔 *¿Qué Prefieres?*\n1. ¿Irme a vivir a tu ciudad mañana mismo, pero sin poder usar celulares nunca más?\n2. ¿Quedarnos a distancia un año más, pero pudiendo hacer videollamada las 24 horas?\n\n¡Decisión difícil! ✈️ vs 📲",

    "🤔 *¿Qué Prefieres?*\n1. ¿Besos apasionados y salvajes de 10 segundos?\n2. ¿Abrazos apretados y calientitos de 10 minutos?\n\n¿Qué te tienta más? 💋 vs 🫂",

    "🤔 *¿Qué Prefieres?*\n1. ¿Cocinar una cena juntos aunque se nos queme la comida y quede fea?\n2. ¿Pedir comida rápida a domicilio y quedarnos jugando videojuegos todo el día?\n\n¿Cuál es tu plan ideal? 🍳 vs 🍔",

    "🤔 *¿Qué Prefieres?*\n1. ¿Que me ponga celoso/a un poquito y te haga un berrinche tierno?\n2. ¿Que me ponga en modo misterioso/a y coqueto/a para provocarte?\n\n¿Qué faceta te gusta más? 🥺 vs 😈",

    "🤔 *¿Qué Prefieres?*\n1. ¿Saber bailar increíblemente bien cualquier ritmo?\n2. ¿Cantar hermoso cualquier canción para dedicarte serenatas?\n\n¿Qué talento prefieres tener? 💃 vs 🎤",

    "🤔 *¿Qué Prefieres?*\n1. ¿Tener que decir la verdad absoluta durante 24 horas seguidas conmigo?\n2. ¿Cumplir 3 retos atrevidos que yo elija sin poder negarte?\n\n¿Qué aceptas? 🫣 vs 🔥",

    "🤔 *¿Qué Prefieres?*\n1. ¿Dormir abrazados toda la noche aunque haga un calor insoportable?\n2. ¿Dormir cada quien en su esquina con aire acondicionado al máximo?\n\n¿Amor o frescura? 🥵 vs 🥶",

    "🤔 *¿Qué Prefieres?*\n1. ¿Viajar juntos al pasado para ver cómo nos conocimos desde otra perspectiva?\n2. ¿Viajar al futuro 5 años para ver dónde y cómo estamos viviendo?\n\n¿A dónde viajamos? ⏳ vs 🚀",

    "🤔 *¿Qué Prefieres?*\n1. ¿Que te haga cosquillas en las costillas durante 1 minuto entero?\n2. ¿Que te haga masajes en la espalda hasta que te quedes dormido/a?\n\n¿Qué prefieres recibir? 🤪 vs 💆‍♂️",

    "🤔 *¿Qué Prefieres?*\n1. ¿Que tengamos una cita elegante vestidos de gala en un restaurante lujoso?\n2. ¿Irnos de parque de atracciones a subirnos a las montañas rusas más locas?\n\n¿Elegancia o adrenalina? 🥂 vs 🎢",

    "🤔 *¿Qué Prefieres?*\n1. ¿Tener la capacidad de teletransportarte solo a mi casa cuando quieras?\n2. ¿Poder pausar el tiempo solo cuando estemos juntos para que las horas no pasen?\n\n¿Qué superpoder elegirías? ⚡ vs ⏱️",

    "🤔 *¿Qué Prefieres?*\n1. ¿Bailar un perreo pegadito en medio de una fiesta llena de gente?\n2. ¿Bailar una canción lenta a solas en la sala con poca luz?\n\n¿Qué ambiente prefieres? 🔥 vs 🌙",

    "🤔 *¿Qué Prefieres?*\n1. ¿Que nunca más podamos comer pizza ni hamburguesas?\n2. ¿Que nunca más podamos ver series o películas juntos?\n\n¿Qué sacrificio harías? 🍕 vs 🍿",

    "🤔 *¿Qué Prefieres?*\n1. ¿Ganarte un viaje todo pagado a París para los dos por una semana?\n2. ¿Ganarte una casa propia amueblada en la ciudad que tú elijas?\n\n¿Viaje o casa? 🗼 vs 🏠",

    "🤔 *¿Qué Prefieres?*\n1. ¿Que te despierte en la mañana con un beso en la frente y desayuno en la cama?\n2. ¿Que te despierte con cosquillitas y un ataque de besos por toda la cara?\n\n¿Cómo prefieres despertar? ☕ vs 💋",

    "🤔 *¿Qué Prefieres?*\n1. ¿Que yo elija toda tu ropa/outfit para una cita importante?\n2. ¿Que yo elija el corte de cabello o peinado que te vas a hacer la próxima vez?\n\n¿En qué me das el control? 👕 vs ✂️",

    "🤔 *¿Qué Prefieres?*\n1. ¿Tener un perro gigante súper juguetón como mascota juntos?\n2. ¿Tener un gato perezoso y tierno que duerma encima de nosotros?\n\n¿Equipo perro o equipo gato? 🐶 vs 🐱",

    "🤔 *¿Qué Prefieres?*\n1. ¿Que te susurre cosas picantes al oído durante una cena familiar sin que nadie se dé cuenta?\n2. ¿Que te mande un mensaje subido de tono a mitad de tu día de trabajo/estudio?\n\n¿Dónde te da más nervios? 🤫 vs 📱",

    "🤔 *¿Qué Prefieres?*\n1. ¿Que siempre que me veas tenga un peinado loco o gracioso?\n2. ¿Que siempre que nos veamos usemos ropa combinada exactamente igual?\n\n¿Qué locura prefieres? 🤪 vs 👯‍♂️",

    "🤔 *¿Qué Prefieres?*\n1. ¿Perder el celular por 3 días enteros?\n2. ¿Sin comer tu comida/postre favorito durante 3 meses?\n\n¿A qué renuncias? 📱 vs 🍨",

    "🤔 *¿Qué Prefieres?*\n1. ¿Pasar un fin de semana entero acampando bajo las estrellas en la montaña?\n2. ¿Pasar un fin de semana en un hotel con piscina y jacuzzi privado?\n\n¿Naturaleza o lujo? 🏕️ vs 🌊",

    "🤔 *¿Qué Prefieres?*\n1. ¿Que te tome fotos distraído/a cuando estás haciendo caras raras?\n2. ¿Que te grabe cantando a todo pulmón cuando no te das cuenta?\n\n¿Qué evidencia te daría más pena? 📸 vs 🎥",

    "🤔 *¿Qué Prefieres?*\n1. ¿Que en nuestra primera cita llueva fuertísimo y nos empapemos completamente?\n2. ¿Que se nos ponche una llanta/arruine el transporte y tengamos que caminar 5 km juntos?\n\n¿Qué aventura eliges? 🌧️ vs 🚶‍♂️",

    "🤔 *¿Qué Prefieres?*\n1. ¿Que te dedique un poema súper cursi escrito a mano por mí?\n2. ¿Que te haga un dibujo/retrato tuyo aunque me quede horrible?\n\n¿Poema o dibujo? 📜 vs 🎨",

    "🤔 *¿Qué Prefieres?*\n1. ¿Ver una maratón de películas de terror a oscuras agarrados de la mano?\n2. ¿Ver una maratón de comedias donde terminemos con dolor de barriga de tanto reír?\n\n¿Susto o risa? 🎃 vs 😂",

    "🤔 *¿Qué Prefieres?*\n1. ¿Que tengamos un lenguaje de señas/secreto que solo nosotros dos entendamos?\n2. ¿Que tengamos un apodo secreto tan tonto que si alguien lo escucha nos dé vergüenza?\n\n¿Clave secreta o apodo raro? 🤫 vs 🙈",

    "🤔 *¿Qué Prefieres?*\n1. ¿Ganar todas las discusiones pequeñitas de la pareja para siempre?\n2. ¿Que nunca volvamos a tener ni un solo desacuerdo en la vida?\n\n¿Tener la razón o paz absoluta? 🏆 vs 🕊️",
    "❓ *¿Qué prefieres?:*\n\n1. Pasar un fin de semana entero sin salir de la cama viendo películas juntos 🍿\n2. Un viaje improvisado a la playa por 3 días 🏖️",
    "❓ *¿Qué prefieres?:*\n\n1. Verte conmigo un fin de semana entero una vez al mes 🗓️\n2. Vivir juntos de golpe pero en una ciudad totalmente nueva para ambos 🏙️",
    "❓ *¿Qué prefieres?:*\n\n1. Tener una cita en un restaurante súper elegante 🕯️\n2. Hacer un picnic nocturno comiendo comida rápida bajo las estrellas 🍔✨",
    "❓ *¿Qué prefieres?:*\n\n1. Que nuestro primer abrazo al vernos sea largo y en silencio 🫂\n2. Que nos dé un ataque de risa al vernos a los ojos 🤭",
    "❓ *¿Qué prefieres?:*\n\n1. Una cita de cocina juntos donde probablemente quememos la cena 🍳\n2. Ir a un parque de atracciones a subirnos a los juegos más extremos 🎢",
    "❓ *¿Qué prefieres?:*\n\n1. Dormirte siempre del lado de la pared 🛌\n2. Dormirte del lado de la puerta 🚪",
    "❓ *¿Qué prefieres?:*\n\n1. Que yo cocine rico pero ensucie toda la cocina 👨‍🍳\n2. Que tú cocines algo sencillo pero dejemos la cocina impecable 🧼",
    "❓ *¿Qué prefieres?:*\n\n1. Que amanezca lloviendo helado para quedarnos en cobijados 🌧️\n2. Un día súper soleado para salir a caminar todo el día ☀️",
    "❓ *¿Qué prefieres?:*\n\n1. Tener 3 perros en casa 🐶\n2. Tener 3 gatos en casa 🐱",
    "❓ *¿Qué prefieres?:*\n\n1. Que elijamos la ropa del otro para salir un día entero 👕\n2. Que elijamos el corte/peinado del otro 💇‍♂️",
    "❓ *¿Qué prefieres?:*\n\n1. Videollamadas de 5 horas seguidas una vez por semana 📱\n2. Audios cortitos de 30 segundos durante todo el día 🎙️",
    "❓ *¿Qué prefieres?:*\n\n1. Que nos quedemos dormidos en llamada toda la noche 💤\n2. Hablar solo 10 minutos justo antes de cerrar los ojos 🌙",
    "❓ *¿Qué prefieres?:*\n\n1. Recibir una carta escrita a mano por correo postal ✉️\n2. Recibir una caja llena de tus golosinas favoritas de sorpresa 📦",
    "❓ *¿Qué prefieres?:*\n\n1. Ver una película al mismo tiempo sincronizados a distancia 🎬\n2. Jugar un videojuego juntos en llamada 🎮",
    "❓ *¿Qué prefieres?:*\n\n1. Que te despierte con un audio cantándote al oído 🎤\n2. Que te mande un mensaje súper largo redactado mientras dormías 📜",
    "❓ *¿Qué prefieres?:*\n\n1. Saberte todos mis secretos oscuros 🤫\n2. Saber exactamente qué estoy pensando en cada momento 🔮",
    "❓ *¿Qué prefieres?:*\n\n1. Un detalle pequeñito pero hecho a mano por mí 🎨\n2. El regalo que lleves meses queriendo comprarte 🎁",
    "❓ *¿Qué prefieres?:*\n\n1. Abrazos apretados todo el tiempo 🫂\n2. Besitos cortitos en la mejilla/frente a cada rato 💋",
    "❓ *¿Qué prefieres?:*\n\n1. Que sea súper cursi y romántico/a en público 🥰\n2. Que sea súper detallista solo cuando estemos a solas 🙈",
    "❓ *¿Qué prefieres?:*\n\n1. Bailar pegados una canción lenta en la sala 🎶\n2. Cantar a todo volumen en el auto desafinados 🚗🎤",
    "❓ *¿Qué prefieres?:*\n\n1. Que nos salga la misma voz durante un día entero 🗣️\n2. Que tengamos que vestirnos con colores idénticos por una semana 👕",
    "❓ *¿Qué prefieres?:*\n\n1. Tener que decir siempre la verdad sin filtro 🤥\n2. No poder hablar durante 24 horas y comunicarnos por señas 🔕",
    "❓ *¿Qué prefieres?:*\n\n1. Salir a la calle pijama combinada 🛌\n2. Ir vestida/o de gala a comer tacos en la calle 🌮",
    "❓ *¿Qué prefieres?:*\n\n1. Olvidar dónde dejamos las llaves del auto cada vez que salimos 🔑\n2. Olvidar qué íbamos a comprar cada vez que entramos al súper 🛒",
    "❓ *¿Qué prefieres?:*\n\n1. Caerte frente a mucha gente juntos y reírnos 🏃‍♂️💨\n2. Confundirte de persona y abrazar a un desconocido por error 😳",
    "❓ *¿Qué prefieres?:*\n\n1. Vivir en una casa pequeña con un patio gigante 🏡\n2. Vivir en un departamento moderno en el centro de la ciudad 🏙️",
    "❓ *¿Qué prefieres?:*\n\n1. Un viaje por carretera recorriendo varios países 🚘\n2. Un vuelo directo a una isla tropical con todo pagado ✈️",
    "❓ *¿Qué prefieres?:*\n\n1. Adoptar un animal raro juntos (un hurón o erizo) 🦔\n2. Tener un mini huerto de verduras en el balcón 🌿",
    "❓ *¿Qué prefieres?:*\n\n1. Que nuestro primer viaje sea a un lugar donde haga mucho frío ❄️\n2. Que sea a un lugar de calor intenso para estar en la piscina 🏊",
    "❓ *¿Qué prefieres?:*\n\n1. Tener una sala de juegos con consola y mesa de billar en casa 🎯\n2. Tener una sala de cine privada con proyector gigante 🍿",
    "❓ *¿Qué prefieres?:*\n\n1. Comer pizza todos los viernes por el resto de tu vida 🍕\n2. Comer tacos todos los domingos por el resto de tu vida 🌮",
    "❓ *¿Qué prefieres?:*\n\n1. No volver a comer chocolate jamás 🍫\n2. No volver a tomar café o refresco jamás ☕",
    "❓ *¿Qué prefieres?:*\n\n1. Cocinar juntos una cena compleja de 3 tiempos 🍽️\n2. Pedir comida a domicilio y comer en el piso de la sala 📦",
    "❓ *¿Qué prefieres?:*\n\n1. Que solo podamos comer cosas saladas por un mes 🥨\n2. Que solo podamos comer postres dulces por un mes 🍰",
    "❓ *¿Qué prefieres?:*\n\n1. Ir a un buffet libre y probar absolutamente todo 🍲\n2. Ir a un puesto callejero muy famoso pero con fila de 1 hora 🌭",
    "❓ *¿Qué prefieres?:*\n\n1. Un beso bajo la lluvia bien dramático estilo película 🌧️💋\n2. Un beso inesperado en frente de todos tus amigos 😏",
    "❓ *¿Qué prefieres?:*\n\n1. Un masaje de espalda relajante con aceites 💆‍♂️\n2. Una sesión de cosquillas hasta que no puedas respirar de la risa 🤣",
    "❓ *¿Qué prefieres?:*\n\n1. Ver una película de terror abrazados 🧟\n2. Ver una película romántica y terminar llorando los dos 🥺",
    "❓ *¿Qué prefieres?:*\n\n1. Que te susurre cosas al oído 👂\n2. Que te haga piojito en el cabello hasta que te duermas 💆‍♀️",
    "❓ *¿Qué prefieres?:*\n\n1. Que te sorprenda llegando a tu ciudad sin avisar ✈️\n2. Que planifiquemos el viaje juntos con 3 meses de anticipación 🗓️",
    "❓ *¿Qué prefieres?:*\n\n1. Que leamos el mismo libro al mismo tiempo 📚\n2. Que nos recomendemos series para comentarlas capítulo a capítulo 📺",
    "❓ *¿Qué prefieres?:*\n\n1. Que nuestro coche sea de un color fosforescente llamativo 🚗\n2. Que tengamos que usar cascos de bicicleta combinados siempre 🚲",
    "❓ *¿Qué prefieres?:*\n\n1. Un súper poder para teletransportarte a mi casa por 10 minutos al día ⚡\n2. Poder leer los pensamientos del otro solo cuando nos agarramos de la mano 🧠",
    "❓ *¿Qué prefieres?:*\n\n1. Que nunca se nos acabe la batería del celular 🔋\n2. Tener internet ilimitado y súper rápido en cualquier lugar del mundo 📶",
    "❓ *¿Qué prefieres?:*\n\n1. Ganar un concurso de baile juntos 🕺\n2. Ganar un torneo de videojuegos en pareja 🎮",
    "❓ *¿Qué prefieres?:*\n\n1. Ir a un concierto de tu artista favorito juntos 🎤\n2. Ir a un festival de comida internacional 🍔",
    "❓ *¿Qué prefieres?:*\n\n1. Dormir con 5 cobijas pesadas ❄️\n2. Dormir con el aire acondicionado al mínimo 🌬️",
    "❓ *¿Qué prefieres?:*\n\n1. Que te tome fotos desprevenido/a y salgan graciosas 📸\n2. Posar para 50 fotos hasta que salga una perfecta 🤳",
    "❓ *¿Qué prefieres?:*\n\n1. Que nos regalemos pijamas combinadas 🧸\n2. Que nos regalemos suéteres con frases graciosas 🧥",
    "❓ *¿Qué prefieres?:*\n\n1. Pasar un cumpleaños solo los dos en una cabaña 🎂\n2. Hacer una fiesta gigante con todos nuestros amigos 🎉"

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

    "Si tuvieras que describir nuestra química en una frase, ¿cuál sería?",
    "¿Cuál es la fantasía más extrema o atrevida que has tenido conmigo y no me has confesado?",
    "¿Qué es lo primero que me harías en cuanto estemos a solas en una habitación a puerta cerrada?",
    "¿Has tenido algún sueño erótico o subido de tono conmigo? Describe exactamente qué pasaba.",
    "¿Cuál es el lugar más arriesgado o público donde te gustaría que tuviéramos un momento íntimo?",
    "¿Hay alguna prenda, lencería o disfraz en particular que te encantaría verme usar en cámara o en persona?",
    "¿Qué es algo atrevido o 'tabú' que siempre has querido probar en la intimidad pero te daba pena pedir?",
    "¿Qué parte de mi cuerpo es la que más te acelera el pulso cuando te la imaginas o la ves?",
    "¿Alguna vez te has quedado con ganas de decirme algo extremadamente picante en llamada y te mordiste la lengua?",
    "¿Qué tipo de caricias o besos te hacen perder el control por completo?",
    "Si tuvieras 1 hora a solas conmigo sin ninguna regla ni límites, ¿cómo empezarías?",
    "¿Alguna vez te has tocado o pensado en mí de forma íntima justo después de colgar una llamada?",
    "¿Cuál ha sido la foto o video mío que más te ha hecho 'pensar cosas malas'?",
    "¿Has sentido ganas de hacer algo atrevido durante una videollamada normal pero no te atreviste?",
    "¿Qué es lo más picante o provocativo que has hecho mientras estabas a solas en tu cuarto pensando en mí?",
    "¿Alguna vez me has hecho un zoom en una foto o video para mirar detenidamente una parte de mi cuerpo?",
    "¿Qué mensaje o audio mío te ha dejado más 'encendido/a' desde que nos conocemos?",
    "¿Te gustaría grabar un video o tomarnos fotos íntimas juntos cuando nos veamos, o prefieres que quede solo en la memoria?",
    "¿Cuál es el pensamiento más sucio o atrevido que has tenido sobre mí en medio del día mientras hacías otra cosa?",
    "¿Si pudieras pedirme que te mande una foto atrevida en este preciso instante, de qué ángulo o posición la querrías?",
    "¿Has fingido estar durmiendo o distraído/a en llamada mientras tenías pensamientos ardientes conmigo?",
    "¿Cuál ha sido tu experiencia o momento más salvaje/extremo en la intimidad en toda tu vida?",
    "¿Alguna vez te han descubierto o casi te atrapan en una situación muy subida de tono?",
    "¿Qué es lo más atrevido que has hecho en un lugar público sin que la gente a tu alrededor se diera cuenta?",
    "¿Prefieres la intimidad tierna y romántica o salvaje y sin control?",
    "¿Cuál es el fetiche o gusto secreto más raro que tienes y que casi nadie sabe?",
    "¿Has usado juguetes o accesorios íntimos pensando en mí mientras hablamos?",
    "¿Qué es lo más loco que estarías dispuesto/a a hacer por cumplirme una fantasía extrema?",
    "¿Alguna vez has sentido celos intensos de alguien solo imaginando que te 'quitaría' un momento íntimo conmigo?",
    "¿Qué palabra o frase dicha al oído te prende de forma instantánea?",
    "¿Te consideras una persona dominante o sumisa a la hora de la pasión?",
    "¿Qué harías si te dijera que en este momento no llevo nada de ropa debajo?",
    "¿Qué es lo que más te atrae de mí físicamente cuando nos ponemos románticos/coquetos?",
    "¿Te atreverías a tener un encuentro atrevido en un auto estacionado o prefieres la comodidad de una cama?",
    "¿Qué sonido, gimiendo o respiración en el micrófono te vuelve más loco/a?",
    "¿Si te diera el control total de mi cuerpo por 30 minutos, qué sería lo primero que harías conmigo?",
    "¿Has imaginado cómo sería nuestro primer encuentro íntimo de principio a fin? Cuéntame un detalle.",
    "¿Te gusta que te muerdan, te jalen el cabello o prefieres el trato suave?",
    "¿Cuál es la zona secreta de tu cuerpo que es extremadamente sensible al tacto?",
    "¿Qué posición o postura es tu favorita absoluta cuando quieres máximo placer?",
    "¿Has visto algún video o leído algo erótico recientemente que te haya hecho recordar algo conmigo?",
    "¿Qué es lo más extremo que has hecho estando borracho/a o en una fiesta?",
    "¿Te gustaría probar el uso de venda en los ojos o ataduras suaves conmigo en la cama?",
    "¿Alguna vez has enviado una foto o video íntimo a la persona equivocada por error?",
    "¿Qué tan rápido se te acelera la respiración cuando nos empezamos a decir cosas calientes por chat?",
    "¿Si te pidiera un reto íntimo en cámara justo ahora, ¿hasta dónde estarías dispuesto/a a llegar?",
    "¿Qué es algo que te da mucha curiosidad probar en la cama pero que te da un poco de miedo o pudor?",
    "¿Prefieres tener momentos íntimos con la luz totalmente encendida o a oscuras?",
    "¿Qué ropa mías te quitarías primero con los dientes si tuvieras la oportunidad?",
    "¿Alguna vez te has sentido tentado/a de hacer 'sexting' o llamada caliente en un sitio peligroso (como el trabajo/escuela)?",
    "¿Qué es lo más travieso que has hecho en la ducha?",
    "¿Sientes que nuestra química física a la distancia es igual o más fuerte que si estuviéramos cerca?",
    "¿Qué aroma o perfume te provoca dar besos insaciables?",
    "¿Cuál es el lugar de tu casa donde más has tenido pensamientos pervertidos conmigo?",
    "¿Qué harías si te despierto a mitad de la noche solo para tener un momento apasionado?",
    "¿Te gusta que tome la iniciativa y sea agresivo/a en la intimidad o prefieres tener el control tú?",
    "¿Cuál es la locura más grande que harías solo por pasar una noche entera a mi lado?",
    "¿Te da morbo la idea de que alguien nos escuche o casi nos descubra mientras estamos juntos?",
    "¿Qué tipo de besos son tus favoritos: los lentos y profundos o los rápidos y mordelones?",
    "¿Has contado cuántos días faltan para vernos solo pensando en el momento en que nos quedemos a solas?",
    "Confiesa: del 1 al 10, ¿qué tan pervertida o salvaje es tu mente en realidad cuando estás conmigo?"

];

const retosPicantes = [

    "📷 Manda una foto sexy o provocativa por el chat ahora mismo.",

    "🎙️ Manda una nota de voz de 10 segundos susurrándome algo coqueto al oído.",

    "🎥 Graba un video corto enviándome un beso coqueto frente a la cámara.",

    "💬 Escríbeme un mensaje corto diciéndome algo coqueto.",

    "📷 manda un video bailando provocativamente de 15 min,si tu pareja se calienta recibe una penalización",

    "📷 tocate en la videollamada por 1 min. si tu pareja se moja/excita recibe una penalizacion",

    "💬 enviale un mensaje provocativo a tu pareja y si se excita recibe una penalizacion",

    "🎥 graba un video provocativo y enviaselo a tu pareja, si se excita recibe una penalizacion",

    "💬 dile a tu pareja que te haga un reto provocativo y si se excita recibe una penalizacion",

    "🎥 graba un video provocativo y enviaselo a tu pareja, si se excita recibe una penalizacion",

    "💬reta a tu pareja a un desafio sin limites",

    "🔥 *RETO:* Tómate una foto haciendo la cara más fea y graciosa que puedas y mándala al chat sin filtros. 📸🤣",

    "🔥 *RETO:* Mándame un mensaje de voz susurrándome al oído lo más coqueto que se te ocurra decirme ahora mismo. 🎙️ susurro",

    "🔥 *RETO:* Ponte una prenda de vestir al revés (o un gorro gracioso) y manténla puesta durante toda la videollamada/llamada. 🧢👕",

    "🔥 *RETO:* Dime tres cosas físicas de mí que te vuelvan loco/a en este preciso instante. 😳🔥",

    "🔥 *RETO:* Mándame una foto de lo que estás vistiendo ahora mismo, pero tomada desde un ángulo muy raro. 📐📸",

    "🔥 *RETO:* Dedícame una declaración de amor exagerada estilo telenovela dramática por nota de voz. 🎭❤️",

    "🔥 *RETO:* Haz 10 sentadillas o 10 despechadas/lagartijas justo ahora y mándame un audio agitado/a al terminar. 🏋️‍♂️💦",

    "🔥 *RETO:* Tómate un vaso de agua completo de un solo trago sin parar a respirar. 🥛⏱️",

    "🔥 *RETO:* Mándame una foto de tu mirada más provocativa o coqueta. 👀🔥",

    "🔥 *RETO:* Imita la voz o forma de hablar de alguien que los dos conozcamos (o un personaje famoso) hasta que adivine quién es. 🗣️🎭",

    "🔥 *RETO:* Escribe mi nombre en tu piel con un lapicero/marcador y mándame foto. ✍️❤️",

    "🔥 *RETO:* Tienes 30 segundos para enviarme una foto de algo rojo que tengas cerca en tu cuarto. ⏱️🔴",

    "🔥 *RETO:* Mándame una foto en espejo mostrando tu outfit completo de hoy. 🪞📸",

    "🔥 *RETO:* Confiésame algo atrevido que hayas pensado sobre mí hoy y que no me habías dicho. 🤫😈",

    "🔥 *RETO:* Envía una nota de voz maullando o ladrando como si fueras una mascota consentida. 🐱🐶",

    "🔥 *RETO:* Tienes que enviarme una foto de tus pies con los dedos abiertos de forma graciosa. 🦶🤣",

    "🔥 *RETO:* Hazme un masaje virtual explicándome paso a paso por audio qué parte de mi cuerpo estás masajeando. 💆‍♂️🎙️",

    "🔥 *RETO:* Mándame una captura de tu pantalla de inicio del celular sin ordenar nada. 📱🔍",

    "🔥 *RETO:* Di un trabalenguas difícil 3 veces seguidas en un audio sin equivocarte (si te equivocas, lo repites). 👅🗣️",

    "🔥 *RETO:* Enséñame tu mejor paso de baile prohibido en un video corto de 5 segundos. 💃🕺",

    "🔥 *RETO:* Dinos una frase súper cursi que jamás le habías dicho a nadie más que a mí. 💌🥺",

    "🔥 *RETO:* Descríbeme detalladamente cómo sería la primera cita perfecta cuando por fin nos veamos. ✈️🌹",

    "🔥 *RETO:* Mándame un emoji que represente lo que sientes por mí en este momento, pero sin explicar por qué. 🤐🙈",

    "🔥 *RETO:* Mándame un sticker o meme de tu galería que nunca me hayas enviado antes. 🖼️📲",

    "🔥 *RETO:* Pon cara de enojado/a tierno/a y mándame una foto. 😠🥺",

    "🔥 *RETO:* Graba un audio diciendo 5 cosas que te gusten de mi personalidad seguidas y sin pausar. ⏱️🎙️",

    "🔥 *RETO:* Mándame una foto mordiéndote el labio de forma coqueta. 💋🔥",

    "🔥 *RETO:* Cuéntame un chiste tan malo que dé risa por lo malo que es. 🤡😂",

    "🔥 *RETO:* Ponte un pedazo de papel en la frente y tómate una foto sonriendo. 📄😁",

    "🔥 *RETO:* Elige una canción de reguetón y susúrrame una barra picante en un mensaje de voz. 🎤😈",

    "🔥 *RETO:* Mándame una foto despeinado/a haciéndote un peinado loco improvisado. 💇‍♂️🤪",

    "🔥 *RETO:* Déjame elegir tu foto de perfil de WhatsApp por las próximas 2 horas. 📸📱",

    "🔥 *RETO:* Mándame un audio imitando el sonido de una sirena de policía durante 5 segundos. 🚨🔊"
    ];

// --- NUEVAS FUNCIONES AGREGADAS ---
const razonesParaQuerte = [
    "💖 *Razón para Querte #1:*\nPor la forma en que tus ojos se iluminan o sonríes cuando me hablas de algo que te apasiona mucho. 🥰",

    "💖 *Razón para Querte #2:*\nPorque haces que la distancia se sienta pequeñita cada vez que nos reímos juntos en llamada. 📱✨",

    "💖 *Razón para Querte #3:*\nPor esa voz tierno/a y única que pones cuando estás buscando que te consienta o te haga mimos. 🧸",

    "💖 *Razón para Querte #4:*\nPorque eres mi notificación favorita del día; ver tu nombre en la pantalla me arregla cualquier momento. 💌",

    "💖 *Razón para Querte #5:*\nPor la paciencia que me tienes cuando me pongo necio/a o cuando me olvido de las cosas. 🙈",

    "💖 *Razón para Querte #6:*\nPorque no hay nadie más con quien prefiera desvelarme hablando de cosas locas y existenciales. 🌙💭",

    "💖 *Razón para Querte #7:*\nPor cómo te ves de tierno/a cuando te estás muriendo de sueño pero igual quieres seguir hablando conmigo. 💤🥺",

    "💖 *Razón para Querte #8:*\nPorque me haces sentir la persona más afortunada del mundo con un simple mensaje de 'buenos días'. ☀️🌾",

    "💖 *Razón para Querte #9:*\nPor tus caritas, muecas y ocurrencias graciosas en las videollamadas que me sacan carcajadas. 🤪📸",

    "💖 *Razón para Querte #10:*\nPorque confías en mí para contarme tus días buenos, tus días malos y tus secretos más profundos. 🤝❤️",

    "💖 *Razón para Querte #11:*\nPor la forma tan bonita en la que defiendes tus ideas y lo decidido/a que eres cuando te propones algo. 🎯🔥",

    "💖 *Razón para Querte #12:*\nPorque me haces imaginar un futuro increíble a tu lado donde no exista la distancia. 🏠✈️",

    "💖 *Razón para Querte #13:*\nPor esos pequeños berrinchitos que haces que en lugar de darme rabia, me dan ganas de darte mil besos. 🤭💋",

    "💖 *Razón para Querte #14:*\nPorque escuchas mis audios larguísimos sin quejarte y respondes a cada detalle. 🎙️escucha",

    "💖 *Razón para Querte #15:*\nPor el enorme corazón que tienes y la empatía con la que tratas a las personas que te rodean. 💖✨",

    "💖 *Razón para Querte #16:*\nPorque incluso en silencio o cuando cada quien está en lo suyo en llamada, tu compañía se siente cálida. 🎧☁️",

    "💖 *Razón para Querte #17:*\nPor las canciones que me recuerdan a ti cada vez que las escucho en la calle o en mi cuarto. 🎶🎧",

    "💖 *Razón para Querte #18:*\nPorque haces que hasta un día aburrido o gris se vuelva divertido si estás tú presente. 🌈",

    "💖 *Razón para Querte #19:*\nPor la manera tan hermosa en la que celebras mis logros, por más chiquitos que sean. 🥳🎉",

    "💖 *Razón para Querte #20:*\nPorque eres mi lugar seguro, ese rinconcito donde puedo ser 100% yo mismo/a sin filtros. 🛡️🤍",

    "💖 *Razón para Querte #21:*\nPor lo bien que te ves cuando te arreglas mucho... y lo infinitamente más hermoso/a que te ves despeinado/a en pijama. 🛌✨",

    "💖 *Razón para Querte #22:*\nPorque me impulsas a ser una mejor versión de mí cada día sin presionarme. 🚀💪",

    "💖 *Razón para Querte #23:*\nPor la química tan brutal que tenemos, que hasta jugando algo tonto nos divertimos al máximo. 🎮🎲",

    "💖 *Razón para Querte #24:*\nPorque guardas detalles y recuerdas cosas pequeñas de mí que ni yo mismo/a recordaba haberte dicho. 🧠📝",

    "💖 *Razón para Querte #25:*\nPor esa risa contagiosa tuya que debería ser considerada una obra de arte. 🎨😂",

    "💖 *Razón para Querte #26:*\nPorque me encanta la idea de que seamos un equipo para todo en esta vida. 🤝🏆",

    "💖 *Razón para Querte #27:*\nPor esa chispa picante y coqueta que le pones a nuestras conversaciones cuando menos me lo espero. 🌶️🔥",

    "💖 *Razón para Querte #28:*\nPorque me cuidas a la distancia haciéndome acordar de comer, descansar o tomar agua. 🥤🥗",

    "💖 *Razón para Querte #29:*\nPor la emoción indescriptible que siento en el pecho cada vez que pienso en el día que por fin nos abracemos. 🫂💓",

    "💖 *Razón para Querte #30:*\nSimplemente porque eres tú... con todos tus detalles, virtudes, locuras y encantos. Te amo tal y como eres. 👑💖",

    "💖 *Razón para Querte #31:*\nPor la forma única en que me dices mi nombre o tus apodos bonitos que me hacen derretir. 🫠🗣️",

    "💖 *Razón para Querte #32:*\nPorque cuando estoy pasando por un momento difícil, una nota de voz tuya me devuelve la paz. 🕊️🎧",

    "💖 *Razón para Querte #33:*\nPor lo inteligente que eres para resolver problemas y darme consejos cuando me siento atascado/a. 🧠💡",

    "💖 *Razón para Querte #34:*\nPorque tienes esa habilidad mágica de hacerme sonreír frente a la pantalla como un tonto/a. 😁📱",

    "💖 *Razón para Querte #35:*\nPor cómo respetas y cuidas nuestro tiempo juntos sin importar lo ocupado/a que estés. ⏱️🤍",

    "💖 *Razón para Querte #36:*\nPor los suspiros que me sacas a mitad del día sin que te des cuenta. 💨😍",

    "💖 *Razón para Querte #37:*\nPorque me encanta cómo te concentras cuando estás haciendo algo importante o jugando. 🤓🎮",

    "💖 *Razón para Querte #38:*\nPor la confianza que me transmites para contarte cualquier ocurrencia rara sin miedo a que me juzgues. 🤪💬",

    "💖 *Razón para Querte #39:*\nPor esa forma tan linda de preocuparte por mí cuando notas que ando un poco callado/a o triste. 🥺🫂",

    "💖 *Razón para Querte #40:*\nPorque haces que la espera y los kilómetros valgan la pena cada solo segundo. ✈️⏳",

    "💖 *Razón para Querte #41:*\nPor tus fotos improvisadas que me mandas al azar y que guardo como si fueran un tesoro. 📸💎",

    "💖 *Razón para Querte #42:*\nPorque me encanta aprender cosas nuevas de ti todos los días. 📖✨",

    "💖 *Razón para Querte #43:*\nPor esa vibra tan bonita y positiva que contagias incluso a través de un mensaje de texto. ⚡🌻",

    "💖 *Razón para Querte #44:*\nPorque compartimos el mismo sentido del humor roto y nos reímos de las mismas tonterías. 🤣💀",

    "💖 *Razón para Querte #45:*\nPor la forma tan linda en que te despides de mí antes de irte a dormir. 🌌💤",

    "💖 *Razón para Querte #46:*\nPorque haces que el amor se sienta fácil, bonito y sin complicaciones ni juegos raros. 🕊️💗",

    "💖 *Razón para Querte #47:*\nPor cómo te brillan las ganas de salir adelante y lograr todos tus sueños. 🌟🚀",

    "💖 *Razón para Querte #48:*\nPorque me haces sentir querido/a y valorado/a de una manera que nunca antes había experimentado. 💝💎",

    "💖 *Razón para Querte #49:*\nPor la paz mental que me da saber que estás en mi vida y que nos apoyamos mutuamente. 🧘‍♂️❤️",

    "💖 *Razón para Querte #50:*\nPorque de entre miles de millones de personas en el mundo, tuvimos la suerte de coincidir tú y yo. 🌍✨"
];

const apodosCoquetos = [
    "🥰 *Tu Apodo Coqueto de Hoy:*\n**'Mi terroncito de azúcar con chiles'** 🌶️ (Tan dulce, pero picante cuando quieres).",

    "🥰 *Tu Apodo Coqueto de Hoy:*\n**'Mi ladrón/a de atención'** 🚨 (No me puedo concentrar en nada porque nomás pienso en ti).",

    "🥰 *Tu Apodo Coqueto de Hoy:*\n**'Mi peluchito enojón'** 🧸 (Te ves súper tierno/a cuando te haces el/la rudo/a).",

    "🥰 *Tu Apodo Coqueto de Hoy:*\n**'Mi aguacatedetect: la mitad perfecta'** 🥑 (Porque sin ti mi plato está incompleto).",

    "🥰 *Tu Apodo Coqueto de Hoy:*\n**'Mi notificación favorita'** 📱 (La única que hace que agarre el teléfono volando).",

    "🥰 *Tu Apodo Coqueto de Hoy:*\n**'Mi criminal preferido/a'** 🥷 (Por robarte mis pensamientos las 24 horas del día).",

    "🥰 *Tu Apodo Coqueto de Hoy:*\n**'Mi chispita de chocolate'** 🍫 (Pequeño/a, dulce y completamente adictivo/a).",

    "🥰 *Tu Apodo Coqueto de Hoy:*\n**'Mi insomnio personal'** 🌙 (La razón principal por la que me desvelo hablando por llamada).",

    "🥰 *Tu Apodo Coqueto de Hoy:*\n**'Mi cachetoncito/a hermoso/a'** 😚 (Pidiendo a gritos un apretón o un beso en persona).",

    "🥰 *Tu Apodo Coqueto de Hoy:*\n**'Mi pandita berrinchudo/a'** 🐼 (Un amor de persona, pero con su carácter especial).",

    "🥰 *Tu Apodo Coqueto de Hoy:*\n**'Mi recarga de energía'** ⚡ (Escuchar tu voz equivale a tres tazas de café).",

    "🥰 *Tu Apodo Coqueto de Hoy:*\n**'Mi tentación de 24 horas'** 😈 (El culpable/la culpable de mis pensamientos atrevidos).",

    "🥰 *Tu Apodo Coqueto de Hoy:*\n**'Mi limonada fresca'** 🍋 (Un poquito agrio/a a veces, pero me encantas igual).",

    "🥰 *Tu Apodo Coqueto de Hoy:*\n**'Mi coquito hermoso'** 🥥 (Duro por fuera, pero puro amor por dentro).",

    "🥰 *Tu Apodo Coqueto de Hoy:*\n**'Mi distracción profesional'** 🎯 (Apareces en el chat y se me olvida todo lo que estaba haciendo).",

    "🥰 *Tu Apodo Coqueto de Hoy:*\n**'Mi drama queen / drama king'** 🎭 (El/La más dramático/a del mundo, pero así te amo).",

    "🥰 *Tu Apodo Coqueto de Hoy:*\n**'Mi regalo sin envoltura'** 🎁 (Lo mejor que me ha pasado en mucho tiempo).",

    "🥰 *Tu Apodo Coqueto de Hoy:*\n**'Mi sazón secreto'** 🧂 (El detalle que le da sabor a todos mis días).",

    "🥰 *Tu Apodo Coqueto de Hoy:*\n**'Mi terremotito'** 🌋 (Llegas y me mueves todo el piso).",

    "🥰 *Tu Apodo Coqueto de Hoy:*\n**'Mi churrito azucarado'** 🥨 (Crujiente por fuera y una dulzura completa).",

    "🥰 *Tu Apodo Coqueto de Hoy:*\n**'Mi imán de abrazos'** 🧲 (No veo la hora de tenerte cerca para no soltarte).",

    "🥰 *Tu Apodo Coqueto de Hoy:*\n**'Mi solcito mañanero'** ☀️ (Aun si te despiertas con la cara arrugada y malhumor).",

    "🥰 *Tu Apodo Coqueto de Hoy:*\n**'Mi meme favorito'** 🤪 (Porque me sacas las mejores sonrisas cuando más lo necesito).",

    "🥰 *Tu Apodo Coqueto de Hoy:*\n**'Mi caprichito'** 🤫 (De esos que quiero consentir todo el tiempo).",

    "🥰 *Tu Apodo Coqueto de Hoy:*\n**'El dueño / la dueña de mis quincenas'** 💸 (Te compraría todo lo que me pidas con tal de verte feliz)."
];

const adivinanzasCanciones = [
    "🎵 *Adivina la Canción (1):*\n'Real hasta la muerte, ¿oíste bebé?' / 'Brrr...'\n\n¿Qué artista de reguetón dice siempre esta frase icónica? 👹🎤",

    "🎵 *Adivina la Canción (2):*\n'Te boteeee, te boté... De mi vida te boté y te boté...'\n\n¿Qué remix épico del género urbano es esta letra? 💔🔥",

    "🎵 *Adivina la Canción (3):*\n'Si veo a tu mamá, yo le pregunto por ti... pa' ver si ya tienes a alguien o si te acuerdas de mí.'\n\n¿De qué canción y álbum de Bad Bunny es esta frase? 🐰🎶",

    "🎵 *Adivina la Canción (4):*\n'Y si con otro pasas el rato, vamo' a ser feliz, vamo' a ser feliz, felices los 4...'\n\n¿Quién canta este temazo de reguetón? 📱🕺",

    "🎵 *Adivina la Canción (5):*\n'TQG: Tu novia se cayó con el pico, y la que te dijo que te olvidó te lo repite...'\n\n¿Qué dos reinas del género urbano cantan esta colaboración? 👑👯‍♀️",

    "🎵 *Adivina la Canción (6):*\n'Quéte'a'o... Quédate, que la noche sin ti duele...'\n\n¿Qué productor y cantante canario sacaron esta Session mundial? 🌋🎧",

    "🎵 *Adivina la Canción (7):*\n'Ella es calladita, pero a la hora de bailar es una loquita...'\n\n¿De qué éxito de Bad Bunny es esta línea? 🤫🔥",

    "🎵 *Adivina la Canción (8):*\n'Se prepara, se baña, se peina, se pone su vestido corto y se va...'\n\n¿De qué clásico del reguetón (Plan B) es esta letra? 👗💃",

    "🎵 *Adivina la Canción (9):*\n'Classy 101: Y si la noche se presta, bailamos un perreo de esos que se sienten...'\n\n¿Qué pareja/artistas cantan este tema súper viral del FERXXO y Young Miko? 💚⚡",

    "🎵 *Adivina la Canción (10):*\n'A ella le gusta la gasolina... ¡Dame más gasolina!'\n\n¿Quién es el rey del reguetón que canta este clásico absoluto? ⛽👑",

    "🎵 *Adivina la Canción (11):*\n'Amanecerá y veremos, pero por si acaso hoy te llamo pa' ver si nos vemos...'\n\n¿De qué tema de Rauw Alejandro o Feid suena esta frase coqueta? 🌌📱",

    "🎵 *Adivina la Canción (12):*\n'Escápate conmigo esta noche bebé, te quiero comer, te quiero tener...'\n\n¿Qué dúo o artista canta este tema imperdible de discoteca? 🌙🔥",

    "🎵 *Adivina la Canción (13):*\n'Ella y yo dos compañeros a las tres, en un bar uno que sufre por amor...'\n\n¿Qué clásico de Don Omar y Aventura empieza con este diálogo icónico? 🍸🗣️",

    "🎵 *Adivina la Canción (14):*\n'Bebecita, tú eres mi diabla y yo soy tu demonio...'\n\n¿Qué tema de Anuel AA y Karol G rompió las redes con esta barra? 👹💖",

    "🎵 *Adivina la Canción (15):*\n'Si supieras que por ti me muero... El osito del pelo negro.'\n\n¿Qué cantante de reguetón se apoda a sí mismo *El Negrito Ojos Claros*? 🧸👀",

    "🎵 *Adivina la Canción (16):*\n'Un x100to: Me queda un 1% y lo usaré solo para decirte que lo siento...'\n\n¿Qué colaboración entre Grupo Frontera y Bad Bunny es esta triste letra? 🪗📱",

    "🎵 *Adivina la Canción (17):*\n'Pasito a pasito, suave suavecito, nos vamos pegando poco a poquito...'\n\n¿Cómo se llama la canción más reproducida en español de Fonsi y Daddy Yankee? 🏖️🎵",

    "🎵 *Adivina la Canción (18):*\n'Tusa: Ya no tiene excusa, hoy sale con su amiga pa' matar la tusa...'\n\n¿De qué éxito mundial de Karol G con Nicki Minaj es este verso? 🦄🔮",

    "🎵 *Adivina la Canción (19):*\n'Todo de ti: El color de tus ojos, tu cabello, tu risa... todo de ti me gusta.'\n\n¿Qué hit ochentero-urbano de Rauw Alejandro es este? 🕺🛼",

    "🎵 *Adivina la Canción (20):*\n'Memorias: Pasarán los días y yo recordando tus besos, tu cuerpo y tus fotos...'\n\n¿De qué éxito de Mora y Jhayco es este coro triste pero bailable? 💔🎧",

    "🎵 *Adivina la Canción (21):*\n'Safaera: Diabla, qué sata... ¿Hoy qué vas a hacer?'\n\n¿Qué canción de Bad Bunny dura más de 4 minutos y cambia de ritmo como 5 veces? 🐸🔥",

    "🎵 *Adivina la Canción (22):*\n'Jordan: Un flow hijuepu... de la cabeza a las Jordan.'\n\n¿Qué artista colombiano (Ryan Castro) canta este verso tan pegajoso? 👟🇨🇴",

    "🎵 *Adivina la Canción (23):*\n'Ayer me llamó mi ex... me dijo que extrañaba cómo le hacía el amor.'\n\n¿Qué colaboración picante hicieron Myke Towers y Chencho Corleone? 📞😈",

    "🎵 *Adivina la Canción (24):*\n'Dakiti: Mami tú 'tás grande, no te cabe en el pantalón...'\n\n¿Qué tema rompió las listas globales cantado por Bad Bunny y Jhayco? 🌴🌊",

    "🎵 *Adivina la Canción (25):*\n'Ella no busca un cuerpo bonito, busca un flow que la ponga a volar...'\n\n¿Qué canción trajo de regreso el reguetón suave estilo 'Pobre Diabla'? 🕊️💔",

    "🎵 *Adivina la Canción (26):*\n'Normal: Ya no estoy pa' ti, ya tengo a otra persona ocupando tu lugar...'\n\n¿De qué tema triste del FERXXO es esta frase? 💚🥀",

    "🎵 *Adivina la Canción (27):*\n'KPOP / Sauce Boyz: 'Kemba Walker' o '333'...'\n\n¿Qué rapero boricua es famoso por sus barras y el sonido Trap latino? 🥷🔥",

    "🎵 *Adivina la Canción (28):*\n'China: Mi combo me llama, dicen que la noche está buena...'\n\n¿Qué mega junta unió a Anuel, Daddy Yankee, Karol G, Ozuna y J Balvin? 🇨🇳🕺",

    "🎵 *Adivina la Canción (29):*\n'Mi gente: Ámsterdam, Colombia, México... todo el mundo bailando.'\n\n¿De qué hit internacional de J Balvin con Willy William hablamos? 🌍🎶",

    "🎵 *Adivina la Canción (30):*\n'La Bachata: Andaba manejando por las calles que cruzaba contigo...'\n\n¿Qué éxito romántico en bachata-urbana sacó Manuel Turizo? 🚗🎸",

    "🎵 *Adivina la Canción (31):*\n'Sola: Hoy no quiere saber de amor, se cansó de las mentiras...'\n\n¿Con qué tema despegó la carrera de Anuel AA en el Trap/Reguetón? 💔👹",

    "🎵 *Adivina la Canción (32):*\n'Hey Mor: No sé qué me dio cuando te vi, me quedé sin aire...'\n\n¿Qué dúo viral armaron Ozuna y Feid con esta canción? 🧸💚",

    "🎵 *Adivina la Canción (33):*\n'Me porto bonito: En la calle es una lady, pero en la cama una fiera...'\n\n¿De qué colaboración entre Bad Bunny y Chencho Corleone es este verso? 😈🔥",

    "🎵 *Adivina la Canción (34):*\n'Rakata rakata, si se me pega voy a darle...'\n\n¿Qué dúo de la historia del reguetón (Wisin & Yandel) canta este himno? 💥🎤",

    "🎵 *Adivina la Canción (35):*\n'Tú eres mi momento favorito del día.'\n\n¿Quién de los dos se ha dicho esta frase bonitona primero por llamada o chat? 🥰💬"
];

const pelisSeriesRecomendadas = [
    "🎬 *Película (1):* **'Your Name'** (Anime / Romance / Fantasía)\nDos desconocidos conectados por el destino y los sueños. Es la película perfecta por excelencia para ver en pareja a distancia. ☄️❤️",

    "🍿 *Serie (2):* **'La Casa de Papel'** (Suspenso / Acción / Drama)\nSi quieren una serie adictiva para hacer maratón en llamada y morderse las uñas con cada capítulo, esta es la indicada. 🎭💶",

    "🎬 *Película (3):* **'About Time' (Cuestión de Tiempo)** (Romance / Drama)\nUna historia preciosa sobre el amor, los viajes en el tiempo y el valor de apreciar cada instante juntos. Prepárense para sonreír y soltar alguna lagrimita. ⏳💖",

    "🍿 *Serie (4):* **'Crash Landing on You' (Aterrizaje de Emergencia en tu Corazón)** (K-Drama / Romance / Comedia)\nUn romance a distancia e imposible entre una heredera surcoreana y un oficial norcoreano. Engancha de principio a fin. 🪂🇰🇷",

    "🎬 *Película (5):* **'500 Days of Summer'** (Comedia Romántica / Drama)\nUna mirada realista, divertida y diferente sobre las etapas de las relaciones y las expectativas en el amor. 🍂💬",

    "🍿 *Serie (6):* **'Stranger Things'** (Misterio / Ciencia Ficción)\nSi les gustan los misterios de los 80, los monstruos y las aventuras grupales, esta serie los mantendrá teorizando juntos por horas. 👾🔦",

    "🎬 *Película (7):* **'Weathering With You' (El tiempo contigo)** (Anime / Romance)\nDel mismo creador de *Your Name*. Una aventura visual hermosa sobre un chico y una chica que puede controlar la lluvia con sus emociones. 🌧️☀️",

    "🍿 *Serie (8):* **'Sex Education'** (Comedia / Adolescencia / Drama)\nSúper divertida, refrescante y con personajes muy queridos. Ideal para reírse juntos en una cita virtual relajada. 🏫🎒",

    "🎬 *Película (9):* **'La La Land'** (Musical / Romance / Drama)\nUna obra maestra sobre perseguir los sueños personales y el impacto de los amores verdaderos en la vida. 🎶🎷",

    "🍿 *Serie (10):* **'Heartstopper'** (Romance / Comedia Juvenil)\nUna serie corta, extremadamente tierna y reconfortante para cuando quieran ver algo bonito que les deje el corazón contento. 🍂 mimos",

    "🎬 *Película (11):* **'Coherence'** (Ciencia Ficción / Suspenso psicológico)\nPelícula de bajo presupuesto pero con una trama alucinante de universos paralelos durante el paso de un cometa. ¡Para quedarse hablando horas al terminar! ☄️🌌",

    "🍿 *Serie (12):* **'Cobra Kai'** (Acción / Comedia / Nostalgia)\nPara los amantes de las artes marciales, los rivales que se vuelven amigos y la comedia ligera. ¡Muy adictiva! 🥋🔥",

    "🎬 *Película (13):* **'A Silent Voice' (Una Voz Silenciosa)** (Anime / Drama / Crecimiento)\nUna historia profunda sobre la empatía, el perdón y la conexión emocional. Un clásico moderno para ver juntos. 🌸👂",

    "🍿 *Serie (14):* **'Emily in Paris'** (Comedia Romántica / Moda)\nEntretenida, llena de enredos amorosos y vistas hermosas de París. Excelente para ver sin complicaciones y comentar la ropa y las locuras de la trama. 🗼🥐",

    "🎬 *Película (15):* **'Palm Springs'** (Comedia Romántica / Bucle Temporal)\nDos desconocidos se quedan atrapados en un bucle temporal repetitivo en una boda. Es fresca, graciosa y con muchísima química. 🌴🔁",

    "🍿 *Serie (16):* **'Wednesday' (Merlina)** (Misterio / Comedia Negra / Fantasía)\nLlena de sarcasmo, elementos góticos y un misterio de asesinatos en una academia que atrapa desde el primer episodio. 🕷️🖤",

    "🎬 *Película (17):* **'Suzume'** (Anime / Aventura / Fantasía)\nUna chica y un misterioso joven viajan por Japón cerrando puertas mágicas que causan desastres. Increíble animación y banda sonora. 🚪🔑",

    "🍿 *Serie (18):* **'The Queen's Gambit' (Gambito de Dama)** (Drama / Juegos de Estrategia)\nAunque no sepan jugar ajedrez, la intensidad y la historia de autosuperación de la protagonista los va a dejar pegados a la pantalla. ♟️👑",

    "🎬 *Película (19):* **'Knives Out' (Entre Navajas y Secretos)** (Misterio / Comedia / Detectives)\nUn detective estrafalario investiga la muerte de un anciano millonario en una familia llena de sospechosos mentirosos. ¡Buenísima para adivinar quién fue! 🕵️‍♂️🔍",

    "🍿 *Serie (20):* **'Modern Family'** (Comedia / Sitcom)\nCapítulos cortos de 20 minutos repletos de risas. Perfecta para ver en videollamada mientras cenan o comen algo juntos. 🌮📺",

    "🎬 *Película (21):* **'A Quiet Place' (Un Lugar en Silencio)** (Terror / Suspenso)\nUna familia debe vivir en silencio absoluto para no ser cazada por criaturas que escuchan todo. Mantiene la tensión al máximo. 🤫👾",

    "🍿 *Serie (22):* **'Alice in Borderland'** (Suspenso / Acción / Juegos de Supervivencia)\nSi les gustó *El Juego del Calamar*, esta serie japonesa llena de acertijos mortales y acción pura los va a enganchar completo. 🃏🔪",

    "🎬 *Película (23):* **'Sing Street'** (Música / Romance / Juventud)\nUn chico de los años 80 arma una banda de rock solo para impresionar a la chica que le gusta. Llena de energía y canciones geniales. 🎸🎤",

    "🍿 *Serie (24):* **'Business Proposal' (Propuesta Laboral)** (K-Drama / Comedia Romántica)\nUna cita a ciegas equivocada termina en una relación falsa entre un jefe exigente y su empleada. Divertidísima y ligera. 💼💌",

    "🎬 *Película (25):* **'The Truman Show'** (Drama / Ciencia Ficción)\nUn hombre descubre que toda su vida ha sido un programa de televisión transmitido en vivo las 24 horas. Un clásico inolvidable. 🎥🌍"
];

const dadosPicantes = [
    "🎲 *Dado Picante:* 'Susurra un secreto travieso' + 'En una nota de voz de 10 seg' 🔥",
    "🎲 *Dado Picante:* 'Envía una foto coqueta' + 'Con la luz bajita' 🫣",
    "🎲 *Dado Picante:* 'Haz una promesa atrevida' + 'Para cuando nos veamos en persona' 💋",
    "🎲 *Dado Picante:* 'envia un video coqueto' + 'diciendo cosas atrevidas' 🫣",
    
];

const adivinaMemes = [
    "🖼️ *Adivina el Meme (1):*\nUn gato blanco sentado en la mesa frente a un plato de ensalada mientras una mujer le grita furiosa señalándolo con el dedo.\n\n¿Cómo se llama o de qué trata el meme? 🤔",

    "🖼️ *Adivina el Meme (2):*\nUn perro sentado muy tranquilo adentro de una casa quemándose en llamas mientras toma café y dice: *'This is fine'* (Todo está bien).\n\n¿Cómo se llama el meme? 🤔",

    "🖼️ *Adivina el Meme (3):*\nUn chico caminando de la mano con su novia en la calle, pero se voltea descaradamente a mirar a otra chica que va pasando.\n\n¿Cómo se conoce a este meme? 🤔",

    "🖼️ *Adivina el Meme (4):*\nUn hombre con traje y lentes oscuros mirando seriamente a la cámara mientras sostiene una taza y dice: *'No tengo pruebas, pero tampoco dudas'*\n\n¿Qué meme es? 🤔",

    "🖼️ *Adivina el Meme (5):*\nDos Spider-Man señalándose el uno al otro en medio de la calle exactamente con el mismo traje.\n\n¿Para qué situación se usa este meme? 🤔",

    "🖼️ *Adivina el Meme (6):*\nUn muñeco azul de Plaza Sésamo (Elmo) levantando los brazos hacia el cielo con un fondo lleno de fuego de infierno.\n\n¿Cómo se llama este meme? 🤔",

    "🖼️ *Adivina el Meme (7):*\nUn perro Shiba Inu musculoso y gigante de un lado, y del otro lado el mismo perro pero chiquito, débil y llorando (*Cheems*).\n\n¿Qué compara este meme? 🤔",

    "🖼️ *Adivina el Meme (8):*\nUn sapo verde animado (Pepe the Frog) acostado en su cama a oscuras mirando fijamente su teléfono celular triste o pensativo.\n\n¿Qué momento representa? 🤔",

    "🖼️ *Adivina el Meme (9):*\nUn señor de edad avanzada sonriendo a la cámara pero con una mirada de sufrimiento y dolor interno profundo (*Hide the Pain Harold*).\n\n¿Quién es este famoso personaje? 🤔",

    "🖼️ *Adivina el Meme (10):*\nUna niña pequeña sonriendo de forma malvada a la cámara mientras detrás de ella se quema una casa por completo.\n\n¿Cómo se le conoce a esta niña? 🤔",

    "🖼️ *Adivina el Meme (11):*\nUn hombre africano con traje formal tocándose la sien/cabeza con el dedo índice con cara de *'pensamiento millonario/inteligente'*.\n\n¿Qué frase suele acompañar a este meme? 🤔",

    "🖼️ *Adivina el Meme (12):*\nUn grupo de hombres con traje elegante bailando alegremente mientras llevan un ataúd sobre sus hombros con música electrónica de fondo.\n\n¿Cómo se llama este meme viral? 🤔",

    "🖼️ *Adivina el Meme (13):*\nLeonardo DiCaprio sonriendo en una fiesta sosteniendo una copa de champán con un traje elegante (escena de El Gran Gatsby).\n\n¿Para qué se usa esta imagen? 🤔",

    "🖼️ *Adivina el Meme (14):*\nUn dinosaurio verde (Philosoraptor) tocándose la barbilla con la pata mirando hacia el cielo mientras se hace una pregunta existencial.\n\n¿Cómo se llama este clásico meme? 🤔",

    "🖼️ *Adivina el Meme (15):*\nHomero Simpson echándose hacia atrás y desapareciendo lentamente adentro de un arbusto verde.\n\n¿En qué situación usas este gif/meme? 🤔"
];

const compatibilidadDiaria = [
    "📊 *Test de Compatibilidad Hoy:* ¡Están al **99%**! Hoy es un día perfecto para una noche de juegos. 💕",
    "📊 *Test de Compatibilidad Hoy:* ¡Sintonía al **100%**! La química está por las nubes. 🔥"
];

const tresVerdadesUnaMentira = [
    "🧩 *3 Verdades y 1 Mentira:*\n1. Me encanta el café por la mañana.\n2. Sé bailar salsa profesionalmente.\n3. Me emociono cada vez que me llamas.\n4. Mi juego favorito es Free Fire.\n\n¿Cuál es la MENTIRA? 🤔",
   
    "🧩 *3 Verdades y 1 Mentira (Ronda 1):*\n1. Me encanta tomar café bien caliente por la mañana. ☕\n2. Sé bailar salsa profesionalmente. 💃\n3. Me emociono cada vez que me llamas por sorpresa. 📱\n4. Mi juego favorito para pasar el rato es Free Fire. 🎮\n\n¿Cuál es la MENTIRA? 🤔",
    
    "🧩 *3 Verdades y 1 Mentira (Ronda 2):*\n1. Una vez me quedé dormido/a con los audífonos puestos en llamada. 😴\n2. Odio las películas de terror y prefiero las de comedia. 🍿\n3. Tengo una cicatriz oculta de cuando era pequeño/a. 🩹\n4. Nunca en mi vida he dicho una mentira piadosa. 🤥\n\n¿Cuál es la MENTIRA? 🤔",
    
    "🧩 *3 Verdades y 1 Mentira (Ronda 3):*\n1. Sé cocinar una receta secreta que te va a encantar. 🍳\n2. Mi primer celular fue un modelo viejísimo con teclas. 📱\n3. He cantado a todo pulmón en la ducha pensando en ti. 🎤\n4. Sé hablar 4 idiomas con fluidez. 🌐\n\n¿Cuál es la MENTIRA? 🤔",
    
    "🧩 *3 Verdades y 1 Mentira (Ronda 4):*\n1. Reviso tu chat varias veces al día aunque no haya mensajes nuevos. 🙈\n2. Me gusta ponerle picante/salsa a casi toda la comida. 🌶️\n3. Una vez me caí en público de la forma más ridícula posible. 🏃‍♂️💨\n4. Soy una persona madrugadora que ama despertarse a las 5 AM. ⏰\n\n¿Cuál es la MENTIRA? 🤔",

    "🧩 *3 Verdades y 1 Mentira (Ronda 5):*\n1. Tengo una lista guardada con cosas que haremos cuando nos veamos. 📝\n2. Le tengo fobia/miedo terrible a las arañas. 🕷️\n3. Nunca me he terminado una serie completa en un solo día. 📺\n4. Sonrío como tonto/a cada vez que me mandas una foto. 🥰\n\n¿Cuál es la MENTIRA? 🤔",

    "🧩 *3 Verdades y 1 Mentira (Ronda 6):*\n1. Sé tocar un instrumento musical decentemente. 🎸\n2. A veces escribo un mensaje largo y lo borro antes de enviártelo. ✍️\n3. Odio el chocolate y prefiero las golosinas ácidas. 🍫\n4. Me sé el número de memoria de mi mejor amigo/a. 📞\n\n¿Cuál es la MENTIRA? 🤔",

    "🧩 *3 Verdades y 1 Mentira (Ronda 7):*\n1. Una vez me confundí de persona y mandé un audio vergonzoso a quien no era. 🎙️\n2. Cuando estoy triste, escuchar tu voz me arregla el día. 🥺\n3. Tengo el hábito de dormirme del lado izquierdo de la cama. 🛌\n4. Sé nadar a nivel profesional y he ganado medallas. 🏊\n\n¿Cuál es la MENTIRA? 🤔",

    "🧩 *3 Verdades y 1 Mentira (Ronda 8):*\n1. Me pongo nervioso/a cuando te arreglas mucho para la videollamada. 😳\n2. Si fuera por mí, comería pizza todos los días sin cansarme. 🍕\n3. Sé arreglar fallas mecánicas de autos sin ayuda. 🛠️\n4. Guardo capturas de pantalla de momentos bonitos en el chat. 📸\n\n¿Cuál es la MENTIRA? 🤔",

    "🧩 *3 Verdades y 1 Mentira (Ronda 9):*\n1. Nunca se me ha roto la pantalla del celular. 📱\n2. A veces me quedo mirando tus fotos antes de irme a dormir. 🌙\n3. Soy súper puntual para cualquier cita o reunión. ⏱️\n4. Una vez me saqué un cero en un examen de la escuela. 📝\n\n¿Cuál es la MENTIRA? 🤔",

    "🧩 *3 Verdades y 1 Mentira (Ronda 10):*\n1. Me da ternura la forma en que pronuncias ciertas palabras. 🤏\n2. Le tengo miedo a la oscuridad si me quedo solo/a. 🌑\n3. Me he leído la saga completa de Harry Potter. 🧙‍♂️\n4. Sé cocinar postres y pasteles como un chef profesional. 🍰\n\n¿Cuál es la MENTIRA? 🤔",

    "🧩 *3 Verdades y 1 Mentira (Ronda 11):*\n1. Me cuesta trabajo admitir cuando pierdo en un juego. 🎲\n2. He practicado en el espejo qué decirte cuando nos veamos cara a cara. 🪞\n3. Nunca he dormido más de 12 horas seguidas. 💤\n4. Prefiero el frío y la lluvia antes que un día soleado de calor. 🌧️\n\n¿Cuál es la MENTIRA? 🤔",

    "🧩 *3 Verdades y 1 Mentira (Ronda 12):*\n1. Me da un poquito de celos cuando alguien te coquetea. 🙈\n2. Sé andar en patineta y hacer trucos. 🛹\n3. A veces pongo una canción romántica y me imagino que estamos juntos. 🎶\n4. Odio los videojuegos de disparos. 🔫\n\n¿Cuál es la MENTIRA? 🤔",

    "🧩 *3 Verdades y 1 Mentira (Ronda 13):*\n1. Tengo una prenda de vestir que considero mi amuleto de la suerte. 👕\n2. Si no respondo rápido, suele ser porque me quedé distraído/a con un video. 📲\n3. He pensado en viajar de sorpresa a verte sin avisarte antes. ✈️\n4. Nunca en mi vida me he roto un hueso. 🦴\n\n¿Cuál es la MENTIRA? 🤔",

    "🧩 *3 Verdades y 1 Mentira (Ronda 14):*\n1. Me gusta cantarte en llamada aunque sienta que canto feo. 🎤\n2. No me gustan para nada las verduras en la comida. 🥦\n3. Sé armar un cubo rubik en menos de un minuto. 🧩\n4. Me sé de memoria la fecha exacta en la que empezamos a hablar. 🗓️\n\n¿Cuál es la MENTIRA? 🤔",

    "🧩 *3 Verdades y 1 Mentira (Ronda 15):*\n1. Me hace sonreír cuando intentas hacerte el/la rudo/a. 😏\n2. Una vez rompí un objeto valioso en mi casa y le eché la culpa al perro/gato. 🐶\n3. Me considero un/a experto/a jugando Parchís o UNO. 🎴\n4. Prefiero tomar refresco caliente en lugar de frío. 🥤\n\n¿Cuál es la MENTIRA? 🤔",
];
const preguntasIncomodasCoquetas = [
    "🫣 *Pregunta Coqueta:* ¿Qué fue lo primero que pensaste cuando viste mi foto por primera vez?",
    "🌶️ *Pregunta Incómoda:* ¿Qué harías si de repente aparezco en tu puerta sin avisar?",
    "🌶️ *Pregunta Incómoda:* ¿Qué harías si cuando estes durmiendo venga y te la meta?",
    "🫣 *Pregunta Coqueta:* ¿Cuál es tu fantasía más atrevida que te gustaría cumplir conmigo?",
    "🌶️ *Pregunta Incómoda:* ¿Qué parte de mi cuerpo te resulta más irresistible y por qué?",
    "🌶️ *Pregunta Incómoda:* ¿Qué fue lo primerito que pensaste cuando viste mi foto por primera vez?",
    "🫣 *Pregunta Coqueta:* ¿Alguna vez me has mentido para no hacerme sentir mal?",
    "🌶️ *Pregunta Incómoda:* ¿Qué harías si te digo que tengo un secreto travieso para ti?",
    "🫣 *Pregunta Coqueta:* ¿Cuál es tu recuerdo más travieso o excitante de nosotros hasta ahora?",
    "🌶️ *Pregunta Incómoda:* ¿Cuál de mis hábitos o costumbres te da un poquito de cringe o risa?",
    "🫣 *Pregunta Coqueta:* Si pudieras cambiar un solo detalle de mi personalidad, ¿cuál sería?",
    "🫣 *Pregunta Coqueta:* ¿Alguna vez sentiste celos de alguien de mi entorno sin decírmelo?",
    "🌶️ *Pregunta Incómoda:* ¿Si estuviéramos en la misma habitación ahora mismo con las luces apagadas, ¿qué sería lo primero que harías?",
    "🫣 *Pregunta Coqueta:* ¿¿Alguna vez dudaste en responder un mensaje mío a propósito para hacerte el/la interesante?",
    "🌶️ *Pregunta Incómoda:* ¿Qué tan rápido se te acelera el corazón cuando te mando una foto coqueta?",
    "🫣 *Pregunta Coqueta:* ¿Cuál?",
    "🌶️ *Pregunta Incómoda:* ¿Alguna vez te has tocado o pensado en mí mientras estamos en llamada o justo después de colgar?",
    "🫣 *Pregunta Coqueta:* ¿Si te pido una foto picante en los próximos 10 segundos, ¿te atreves a mandarla?",
    "🌶️ *Pregunta Incómoda:* ¿Cuál es la foto o video privado mío que más veces has vuelto a ver?",
    "🫣 *Pregunta Coqueta:* ¿Qué juego de roles (doctor/paciente, profesor/alumno, etc.) te daría más curiosidad intentar conmigo?",
    "🌶️ *Pregunta Incómoda:* ¿Te gusta que te hablen sucio/coquetón durante la intimidad o prefieres el silencio y la respiración?",
    "🫣 *Pregunta Coqueta:* ¿Cuál es la fantasía más atrevida que te gustaría cumplir conmigo en persona algún día?",
    "🌶️ *Pregunta Incómoda:* ¿cuando fue la ultima vez que te tocaste y pensando en quien?",
    "🫣 *Pregunta Coqueta:* ¿Cuál es la parte de mi cuerpo que más te gustaría explorar con tus manos o labios?",
    "🌶️ *Pregunta Incómoda:* ¿Alguna vez has tenido un sueño travieso conmigo y qué pasó en ese sueño?",
    "🫣 *Pregunta Coqueta:* ¿Si te doy la oportunidad de elegir un lugar público para cojer, cuál sería y por qué?",

];

const cuponesAmor = [
    "🎟️ *CUPÓN VIRTUAL:* Válido por 'Elegir la película o juego de hoy sin objeciones' 🍿",
    "🎟️ *CUPÓN VIRTUAL:* Válido por 'Un masaje relajante acumulado para cuando nos veamos' 💆‍♂️💆‍♀️",
    "🎟️ *CUPÓN VIRTUAL:* Válido por 'Una sesión de mimos y elogios por llamada' 💖",
    "🎟️ *CUPÓN VIRTUAL:* Válido por 'Un reto atrevido a elección de tu pareja' 🔥",
    "🎟️ *CUPÓN VIRTUAL:* Válido por 'Una confesión romántica y sincera en videollamada' 💌",
    "🎟️ *CUPÓN VIRTUAL:* Válido por 'Una noche de juegos y risas sin interrupciones' 🎲",
    "🎟️ *CUPÓN VIRTUAL:* valido por 'noche de trabesuras 💬",
    "🎟️ *CUPÓN VIRTUAL:* valido por 'prohibir al otro salir de su casa",
];

const desafiosSensuales = [
    "💋 *Desafío Sensual:* Envía un mensaje de voz de 5 segundos susurrando lo que más te gusta de mí.",
    "🔥 *Desafío Sensual:* Manda una foto sosteniendo un letrero que diga algo provocativo.",
    "🔥 *Desafío Sensual:* Haz un baile sensual/provocativo por 2 min en ropa interior en videollamada",
    "💌 *Desafío Sensual:* Escribe una carta de amor atrevida y léela en voz alta en llamada.",
    "💋 *Desafío Sensual:* enfoca tus labios a la camara y finje que estas dando besos con lengua",
    "🔥 *Desafío Sensual:* Haz un striptease virtual de 1 minuto en videollamada",
    "💌 *Desafío Sensual:* Envíame un audio provocativo y si me excito, recibes una penalización",
    "🔥 *Desafío Sensual:* Haz un reto atrevido y si me excito, recibes una penalización",
    "💋 *Desafío Sensual:* empieza a tocarte por 1 min mientras que yo te diga cosas al oido",
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
                ['☀️ clima/hora local'],
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

// --- COMANDO DIRECTO PARA DADO / VOLADO ---
bot.onText(/\/volado/, (msg) => {
    bot.sendMessage(msg.chat.id, lanzarDadoYVolado(), { parse_mode: 'Markdown' });
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
        bot.sendMessage(chatId, `💖 *Razón para quererte:* \n\n${razonesParaQuerte[Math.floor(Math.random() * razonesParaQuerte.length)]}`, { parse_mode: 'Markdown' });
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
                    [{ text: '🤩 Feliz', callback_data: 'animo_feliz' }, { text: '🥰 Romántico/a', callback_data: 'animo_romantico' }],
                    [{ text: '😴 Cansado/a', callback_data: 'animo_cansado' }, { text: '🥺 Necesito un abrazo', callback_data: 'animo_abrazo' }]
                ]
            }
        });
    }
// --- COMANDO DE CLIMA Y HORA LOCAL ---
    if (texto === '☀️ clima/hora local' || texto === '🌞 clima/hora local' || texto === 'clima/hora local' || texto === '/clima') {
        const horaVE = new Date().toLocaleTimeString('es-VE', { 
            timeZone: 'America/Caracas', 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: true 
        });

        const horaMX = new Date().toLocaleTimeString('es-MX', { 
            timeZone: 'America/Mexico_City', 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: true 
        });

        const apiKey = process.env.OPENWEATHER_API_KEY;

        if (apiKey) {
            Promise.all([
                axios.get(`https://api.openweathermap.org/data/2.5/weather?q=Caracas&appid=${apiKey}&units=metric&lang=es`),
                axios.get(`https://api.openweathermap.org/data/2.5/weather?q=Mexico City&appid=${apiKey}&units=metric&lang=es`)
            ])
            .then(([resVE, resMX]) => {
                const tempVE = Math.round(resVE.data.main.temp);
                const descVE = resVE.data.weather[0].description;
                const tempMX = Math.round(resMX.data.main.temp);
                const descMX = resMX.data.weather[0].description;

                const mensaje = `🕒 *HORA Y CLIMA ACTUAL*\n\n` +
                                `🇻🇪 *Venezuela:* ${horaVE}\n` +
                                `🌤️ *Clima (Caracas):* ${tempVE}°C, ${descVE}\n\n` +
                                `🇲🇽 *México:* ${horaMX}\n` +
                                `🌤️ *Clima (CDMX):* ${tempMX}°C, ${descMX}`;

                bot.sendMessage(chatId, mensaje, { parse_mode: 'Markdown' });
            })
            .catch(() => {
                const mensajeError = `🕒 *HORA ACTUAL*\n\n` +
                                     `🇻🇪 *Venezuela:* ${horaVE}\n` +
                                     `🇲🇽 *México:* ${horaMX}\n\n` +
                                     `⚠️ _No se pudo obtener el clima en este momento._`;
                bot.sendMessage(chatId, mensajeError, { parse_mode: 'Markdown' });
            });
        } else {
            const mensajeSoloHora = `🕒 *HORA ACTUAL*\n\n` +
                                    `🇻🇪 *Venezuela:* ${horaVE}\n` +
                                    `🇲🇽 *México:* ${horaMX}`;
            bot.sendMessage(chatId, mensajeSoloHora, { parse_mode: 'Markdown' });
        }
    }
// BOTÓN DE TECLADO: DADO / VOLADO
    if (texto === '🎰 Dado / Volado') {
        bot.sendMessage(chatId, lanzarDadoYVolado(), { parse_mode: 'Markdown' });
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
});
// Conversor de Monedas (Simulado)
bot.onText(/\/divisas (.+)/, (msg, match) => {
    const usd = parseFloat(match[1]);
    if (isNaN(usd)) return bot.sendMessage(msg.chat.id, "Por favor ingresa un número válido. Ej: `/divisas 50`");
    const eur = (usd * 0.92).toFixed(2);
    bot.sendMessage(msg.chat.id, `🔱 *Conversor de Moneda:*\n\n💵 **$${usd} USD** equivalen aprox. a **€${eur} EUR**`, { parse_mode: 'Markdown' });
});

// VERDAD O RETO & CALLBACKS
bot.on('callback_query', async (query) => {
    const chatId = query.message.chat.id;
    const data = query.data;

    // 1. OBLIGATORIO: Detiene el reloj de carga en Telegram y frena los reintentos
    await bot.answerCallbackQuery(query.id);

    // Lógica para Verdad o Reto
    if (data === 'v') bot.sendMessage(chatId, `🎭 *VERDAD:* ${verdadesPicantes[Math.floor(Math.random() * verdadesPicantes.length)]}`, { parse_mode: 'Markdown' });
    if (data === 'r') bot.sendMessage(chatId, `🔥 *RETO PICANTE:* ${retosPicantes[Math.floor(Math.random() * retosPicantes.length)]}`, { parse_mode: 'Markdown' });

    // Lógica para Estado de Ánimo
    if (data.startsWith('animo_')) {
        const tipo = data.split('_')[1].toUpperCase();
        bot.sendMessage(chatId, `🎭 *Estado de ánimo actualizado:* Tu pareja acaba de marcar que se siente ${tipo} hoy. ✨`, { parse_mode: 'Markdown' });
    }

    // Lógica para Aventura
    if (data === 'adv_roja') bot.sendMessage(chatId, "🚪 Entraron a la habitación roja y encontraron...");
    if (data === 'adv_azul') bot.sendMessage(chatId, "🔑 La puerta azul los llevó a una cita virtual...");
});
// --- COMANDO ASISTENTE IA GEMINI ---
bot.onText(/\/ia (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const prompt = match[1];

    try {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1/models/gemini-3.5-flash:generateContent?key=${GEMINI_API_KEY}`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }]
                })
            }
        );

        const data = await response.json();

        if (data.error) {
            throw new Error(data.error.message);
        }

        const respuestaTexto = data.candidates[0].content.parts[0].text;
        bot.sendMessage(chatId, `🤖 *Respuesta:*\n\n${respuestaTexto}`);

    } catch (error) {
        console.error("Error al consultar Gemini:", error);
        const mensajeError = error?.message || "Error desconocido";
        bot.sendMessage(chatId, `⚠️ *Error exacto:* ${mensajeError}`);
    }
});
// Cierre de bot.on('message')

console.log('¡Bot actualizado y listo con 23+ nuevas funciones! 🤖🎉');

// Manejador para los botones interactivos de Verdad / Reto
bot.on('callback_query', (query) => {
    const chatId = query.message.chat.id;

    if (query.data === 'v') {
        const verdad = verdadesPicantes[Math.floor(Math.random() * verdadesPicantes.length)];
        bot.sendMessage(chatId, `🔮 *VERDAD:* \n\n${verdad}`, { parse_mode: 'Markdown' });
    } else if (query.data === 'r') {
        const reto = retosPicantes[Math.floor(Math.random() * retosPicantes.length)];
        bot.sendMessage(chatId, `🔥 *RETO:* \n\n${reto}`, { parse_mode: 'Markdown' });
    }

    // Le avisa a Telegram que se presionó el botón para quitar el relojito de carga
    bot.answerCallbackQuery(query.id);
});