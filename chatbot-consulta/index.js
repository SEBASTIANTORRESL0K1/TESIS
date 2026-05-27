const express = require('express');
const { ChromaClient } = require('chromadb');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const multer = require('multer');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
app.use(express.json());

// Configuración de Multer para recibir archivos en memoria
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const PORT = process.env.PORT || 3003;
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_12345';

// Configuración de Gemini
if (!process.env.GEMINI_API_KEY) {
    console.error("ERROR: GEMINI_API_KEY no está definida en las variables de entorno.");
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const embeddingModel = genAI.getGenerativeModel({ model: "gemini-embedding-2" });
const generationModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

// Configuración de ChromaDB
const chromaClient = new ChromaClient({
    path: process.env.CHROMA_URL || "http://localhost:8000"
});

// Configuración de Pool de Conexiones a MySQL
const dbPool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'root_password_1234',
    database: process.env.DB_NAME || 'tesis_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Probar conexión a la base de datos al iniciar
(async () => {
    try {
        const connection = await dbPool.getConnection();
        console.log("Conectado exitosamente a la base de datos MySQL.");
        connection.release();
    } catch (err) {
        console.error("Error crítico: No se pudo conectar a MySQL:", err.message);
    }
})();

/**
 * Middleware para verificar JWT
 */
function verificarToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Formato: Bearer <TOKEN>

    if (!token) {
        return res.status(401).json({ error: "Acceso no autorizado. Token no provisto." });
    }

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(403).json({ error: "Token inválido o expirado." });
        }
        req.user = decoded; // { id, nombre, email, role_id, role_name }
        next();
    });
}

/**
 * Middleware para filtrar por roles
 */
function requerirRoles(rolesPermitidos) {
    return (req, res, next) => {
        if (!req.user || !rolesPermitidos.includes(req.user.role_name)) {
            return res.status(403).json({ error: "Acceso denegado. Permisos insuficientes." });
        }
        next();
    };
}

/**
 * Genera embeddings para un texto usando Gemini, con reintentos para manejar límites de cuota (429)
 */
async function generateEmbedding(text, retries = 3, delay = 2000) {
    for (let i = 0; i < retries; i++) {
        try {
            const result = await embeddingModel.embedContent(text);
            return result.embedding.values;
        } catch (error) {
            const isRateLimit = error.message && (
                error.message.includes("429") || 
                error.message.toLowerCase().includes("quota") || 
                error.message.toLowerCase().includes("too many requests")
            );
            if (isRateLimit && i < retries - 1) {
                console.warn(`[Gemini Embedding] Límite de cuota/429 detectado. Reintentando en ${delay}ms... (Intento ${i + 1}/${retries})`);
                await new Promise(resolve => setTimeout(resolve, delay));
                delay *= 2; // Backoff exponencial
                continue;
            }
            throw error;
        }
    }
}

// ==========================================
// ENDPOINTS DE AUTENTICACIÓN
// ==========================================

/**
 * Registrar un nuevo Alumno (público)
 */
app.post('/auth/registrar', async (req, res) => {
    try {
        const { nombre, email, password } = req.body;

        if (!nombre || !email || !password) {
            return res.status(400).json({ error: "Todos los campos (nombre, email, password) son obligatorios." });
        }

        // Validar si ya existe el correo
        const [usuariosExistentes] = await dbPool.execute(
            "SELECT id FROM usuarios WHERE email = ?",
            [email]
        );

        if (usuariosExistentes.length > 0) {
            return res.status(400).json({ error: "El correo electrónico ya está registrado." });
        }

        // Cifrar contraseña
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        // Rol por defecto: alumno (role_id = 3)
        const [result] = await dbPool.execute(
            "INSERT INTO usuarios (nombre, email, password_hash, role_id) VALUES (?, ?, ?, 3)",
            [nombre, email, passwordHash]
        );

        res.status(201).json({
            status: "ok",
            message: "Usuario registrado correctamente como Alumno.",
            id: result.insertId
        });

    } catch (error) {
        console.error("Error en registro:", error);
        res.status(500).json({
            error: "Error interno al registrar usuario.",
            details: error.message
        });
    }
});

/**
 * Inicio de sesión (Login)
 */
app.post('/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: "Email y contraseña son obligatorios." });
        }

        // Buscar usuario e incluir su rol
        const [usuarios] = await dbPool.execute(
            `SELECT u.*, r.nombre as role_name 
             FROM usuarios u 
             JOIN roles r ON u.role_id = r.id 
             WHERE u.email = ?`,
            [email]
        );

        if (usuarios.length === 0) {
            return res.status(401).json({ error: "Credenciales inválidas." });
        }

        const usuario = usuarios[0];

        // Validar contraseña
        const match = await bcrypt.compare(password, usuario.password_hash);
        if (!match) {
            return res.status(401).json({ error: "Credenciales inválidas." });
        }

        // Crear token JWT (expira en 8 horas)
        const payload = {
            id: usuario.id,
            nombre: usuario.nombre,
            email: usuario.email,
            role_id: usuario.role_id,
            role_name: usuario.role_name
        };

        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '8h' });

        res.json({
            status: "ok",
            message: "Inicio de sesión exitoso.",
            token,
            user: {
                id: usuario.id,
                nombre: usuario.nombre,
                email: usuario.email,
                role: usuario.role_name
            }
        });

    } catch (error) {
        console.error("Error en login:", error);
        res.status(500).json({
            error: "Error interno al iniciar sesión.",
            details: error.message
        });
    }
});

// ==========================================
// ENDPOINTS DE CHATBOT (RAG) PROTEGIDOS
// ==========================================

/**
 * Consultar al Chatbot (Cualquier usuario autenticado)
 * Guarda la consulta si el usuario es alumno
 */
app.post('/consultar', verificarToken, async (req, res) => {
    try {
        const { pregunta } = req.body;

        if (!pregunta) {
            return res.status(400).json({ error: "La pregunta es obligatoria en req.body.pregunta" });
        }

        console.log(`[Usuario ID: ${req.user.id} (${req.user.role_name})] Procesando pregunta: "${pregunta}"`);

        // 1. Generar embedding de la pregunta
        const questionEmbedding = await generateEmbedding(pregunta);

        // 2. Consultar ChromaDB
        const collection = await chromaClient.getCollection({
            name: "materiales_academicos"
        });

        const results = await collection.query({
            queryEmbeddings: [questionEmbedding],
            nResults: 3
        });

        // 3. Unir fragmentos para el contexto y extraer fuentes
        const contextParts = results.documents[0] || [];
        const metadataParts = results.metadatas[0] || [];
        
        const contexto = contextParts.join('\n\n');
        const fuentes = [...new Set(metadataParts.map(m => m.source || m.filename || 'Desconocido'))];

        if (contextParts.length === 0) {
            return res.json({
                respuesta: "Lo siento, no he encontrado información relevante en los materiales académicos actuales para responder a tu pregunta.",
                fuentes: []
            });
        }

        // 4. Construir el prompt para Gemini
        const prompt = `Eres un asistente académico inteligente y amigable. Responde la siguiente pregunta utilizando ÚNICAMENTE el contexto provisto extraído de los materiales de clase. Si la respuesta no viene en el contexto, di amablemente que no cuentas con esa información en los archivos actuales.

Contexto:
${contexto}

Pregunta del alumno: ${pregunta}`;

        // 5. Generar respuesta con Gemini
        const result = await generationModel.generateContent(prompt);
        const respuestaText = result.response.text();

        // 6. Si el usuario logueado es 'alumno', guardar la consulta en la base de datos MySQL
        if (req.user.role_name === 'alumno') {
            try {
                await dbPool.execute(
                    "INSERT INTO preguntas (alumno_id, pregunta, respuesta, fuentes) VALUES (?, ?, ?, ?)",
                    [req.user.id, pregunta, respuestaText, JSON.stringify(fuentes)]
                );
                console.log(`[Base de Datos] Pregunta de alumno ${req.user.id} guardada con éxito.`);
            } catch (dbErr) {
                console.error("Error al registrar la pregunta en MySQL:", dbErr.message);
            }
        }

        // 7. Enviar respuesta al cliente
        res.json({
            respuesta: respuestaText,
            fuentes: fuentes
        });

    } catch (error) {
        console.error("Error en el endpoint /consultar:", error);
        res.status(500).json({
            error: "Hubo un error al procesar tu consulta.",
            details: error.message
        });
    }
});

/**
 * Obtener el historial de consultas de un Alumno
 */
app.get('/preguntas/historial', verificarToken, async (req, res) => {
    try {
        // Obtenemos solo las preguntas del alumno autenticado
        const [preguntas] = await dbPool.execute(
            "SELECT id, pregunta, respuesta, fuentes, created_at FROM preguntas WHERE alumno_id = ? ORDER BY created_at DESC",
            [req.user.id]
        );

        const historial = preguntas.map(p => {
            let fuentesParsed = [];
            try {
                fuentesParsed = JSON.parse(p.fuentes);
            } catch (e) {
                fuentesParsed = p.fuentes ? p.fuentes.split(',') : [];
            }
            return {
                id: p.id,
                pregunta: p.pregunta,
                respuesta: p.respuesta,
                fuentes: fuentesParsed,
                fecha: p.created_at
            };
        });

        res.json({
            status: "ok",
            historial
        });

    } catch (error) {
        console.error("Error al obtener historial:", error);
        res.status(500).json({
            error: "Error interno al obtener el historial.",
            details: error.message
        });
    }
});

/**
 * Obtener el análisis analítico de dudas de los alumnos para docentes/admins (Protegido)
 * Utiliza Gemini en lote para filtrar preguntas basura, extraer conceptos críticos e insights.
 */
app.get('/analisis/dudas', verificarToken, requerirRoles(['admin', 'docente']), async (req, res) => {
    try {
        // 1. Obtener las últimas 100 preguntas de los alumnos de la base de datos
        const [rows] = await dbPool.execute(
            `SELECT p.pregunta, p.fuentes 
             FROM preguntas p 
             JOIN usuarios u ON p.alumno_id = u.id 
             JOIN roles r ON u.role_id = r.id 
             WHERE r.nombre = 'alumno' 
             ORDER BY p.created_at DESC 
             LIMIT 100`
        );

        if (rows.length === 0) {
            return res.json({
                status: "ok",
                vacio: true,
                message: "Aún no hay suficientes consultas de alumnos para generar el informe analítico."
            });
        }

        const totalConsultas = rows.length;
        
        // Unir todas las preguntas en una lista numerada para que la procese Gemini
        const preguntasTexto = rows.map((r, i) => `${i + 1}. "${r.pregunta}"`).join('\n');

        // Extraer los nombres de las fuentes recopiladas para dar contexto sobre cuáles son los materiales
        const todasFuentes = [];
        rows.forEach(r => {
            try {
                const fuentesParsed = JSON.parse(r.fuentes);
                if (Array.isArray(fuentesParsed)) {
                    todasFuentes.push(...fuentesParsed);
                }
            } catch (e) {
                // ignorar errores de parseo
            }
        });
        
        const fuentesUnicas = [...new Set(todasFuentes)].join(', ');
        
        // 2. Definir el prompt especializado para Gemini
        const prompt = `Actúas como un Analista Educativo y Científico de Datos. Tu objetivo es procesar un lote de preguntas realizadas por los alumnos a un asistente virtual de materias tecnológicas de ciberseguridad, redes o desarrollo seguro, y generar un informe analítico estructurado en formato JSON estrictamente válido.

Instrucciones de análisis:
1. **Filtra las "Preguntas Basura"**: Identifica de inmediato saludos (ej: "hola", "buenas"), agradecimientos ("gracias", "adiós"), bromas, chistes, preguntas sobre clima, deportes, cocina o cualquier tema ajeno a la materia académica de clase.
2. **Calcula el Porcentaje de Basura**: Cuenta exactamente cuántas preguntas del total son basura y calcula el porcentaje representativo de ocio.
3. **Extrae los Conceptos Críticos Académicos**: Para las preguntas legítimas (no basura), extrae los términos, herramientas o conceptos específicos de ciberseguridad o desarrollo (ej: Inyección SQL, Bcrypt, Middleware, docker-compose) sobre los que los estudiantes tienen dudas. Agrúpalos por frecuencia, calcula cuántas consultas tuvieron, y asígnales una prioridad: "alto", "medio" o "bajo" según la severidad y repetición de la confusión.
4. **Redacta una Sugerencia Pedagógica Práctica (Insight)**: Escribe una recomendación pedagógica específica de 1 a 2 párrafos dirigida al profesor, sugiriéndole qué repasar, qué ejercicio práctico realizar o cómo abordar las confusiones más críticas de su clase en la próxima sesión.
5. **Infiere el Material de Mayor Confusión**: Basado en las palabras clave y en los siguientes nombres de archivos/fuentes que fueron consultadas por el bot: [${fuentesUnicas || 'Ninguno en específico'}], infiere cuál es el documento o tema en PDF que presenta mayor índice de dudas.

IMPORTANTE: Debes retornar ÚNICAMENTE un objeto JSON válido, sin delimitadores de markdown como \`\`\`json ni texto introductorio. El formato debe ser exactamente:
{
  "total_analizadas": ${totalConsultas},
  "basura_porcentaje": <número entero entre 0 y 100 representativo de consultas fuera de tema>,
  "conceptos_criticos": [
    { "concepto": "<nombre de palabra clave académica>", "nivel": "alto|medio|bajo", "consultas": <conteo estimado> }
  ],
  "insight_pedagogico": "<recomendación pedagógica para el profesor>",
  "material_dudoso": "<nombre del material o tema que genera más dudas>"
}

Preguntas de los Alumnos a Analizar:
${preguntasTexto}`;

        // 3. Consultar a Gemini
        const result = await generationModel.generateContent(prompt);
        let responseText = result.response.text().trim();
        
        // Limpiar delimitadores markdown si los hay
        if (responseText.startsWith("```")) {
            responseText = responseText.replace(/^```json\s*/i, "").replace(/```$/, "").trim();
        }

        // Intentar parsear el JSON generado por Gemini
        let analisisData;
        try {
            analisisData = JSON.parse(responseText);
        } catch (parseError) {
            console.error("Error al parsear el JSON retornado por Gemini. Respuesta cruda:", responseText);
            throw new Error("La inteligencia artificial retornó un formato no válido. Por favor, reintente.");
        }

        res.json({
            status: "ok",
            vacio: false,
            analisis: analisisData
        });

    } catch (error) {
        console.error("Error en endpoint /analisis/dudas:", error);
        res.status(500).json({
            error: "Error interno al procesar la analítica de dudas de alumnos.",
            details: error.message
        });
    }
});

/**
 * Ingestar texto directo (Protegido: Solo admin y docente)
 */
app.post('/ingestar', verificarToken, requerirRoles(['admin', 'docente']), async (req, res) => {
    try {
        const { texto, nombreArchivo } = req.body;

        if (!texto || !nombreArchivo) {
            return res.status(400).json({ error: "texto y nombreArchivo son obligatorios" });
        }

        console.log(`[Ingesta] Archivo recibido: ${nombreArchivo} por ${req.user.nombre}`);

        const collection = await chromaClient.getOrCreateCollection({
            name: "materiales_academicos",
            metadata: { "hnsw:space": "cosine" }
        });

        const embedding = await generateEmbedding(texto);
        const id = `${nombreArchivo}-${Date.now()}`;
        
        await collection.add({
            ids: [id],
            embeddings: [embedding],
            metadatas: [{ source: nombreArchivo }],
            documents: [texto]
        });

        res.json({ status: "ok", message: `Archivo ${nombreArchivo} ingestada correctamente`, id });

    } catch (error) {
        console.error("Error en el endpoint /ingestar:", error);
        res.status(500).json({
            error: "Hubo un error al ingestar el documento.",
            details: error.message
        });
    }
});

/**
 * Ingestar archivo .md o .txt (Protegido: Solo admin y docente)
 */
app.post('/ingestar-archivo', verificarToken, requerirRoles(['admin', 'docente']), upload.single('archivo'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "Por favor, sube un archivo (.md o .txt)" });
        }

        const nombreArchivo = req.file.originalname;
        const texto = req.file.buffer.toString('utf8');

        if (!texto.trim()) {
            return res.status(400).json({ error: "El archivo está vacío" });
        }

        console.log(`[Ingesta Archivo] Recibido: ${nombreArchivo} por ${req.user.nombre}`);

        const collection = await chromaClient.getOrCreateCollection({
            name: "materiales_academicos",
            metadata: { "hnsw:space": "cosine" }
        });

        const embedding = await generateEmbedding(texto);
        const id = `${nombreArchivo}-${Date.now()}`;

        await collection.add({
            ids: [id],
            embeddings: [embedding],
            metadatas: [{ source: nombreArchivo }],
            documents: [texto]
        });

        res.json({ 
            status: "ok", 
            message: `Archivo ${nombreArchivo} ingestada correctamente`, 
            id 
        });

    } catch (error) {
        console.error("Error en /ingestar-archivo:", error);
        res.status(500).json({
            error: "Hubo un error al procesar el archivo.",
            details: error.message
        });
    }
});

app.get('/health', (req, res) => {
    res.json({ status: "ok", service: "chatbot-consulta" });
});

app.listen(PORT, () => {
    console.log(`Servidor de consulta y autenticación corriendo en puerto ${PORT}`);
});
