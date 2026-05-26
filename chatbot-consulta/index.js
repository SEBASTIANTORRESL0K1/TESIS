const express = require('express');
const { ChromaClient } = require('chromadb');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const multer = require('multer');
require('dotenv').config();

const app = express();
app.use(express.json());

// Configuración de Multer para recibir archivos en memoria
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const PORT = process.env.PORT || 3003;

// Configuración de Gemini
if (!process.env.GEMINI_API_KEY) {
    console.error("ERROR: GEMINI_API_KEY no está definida en las variables de entorno.");
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
// Usando los modelos disponibles en tu entorno (Mayo 2026)
const embeddingModel = genAI.getGenerativeModel({ model: "gemini-embedding-2" });
const generationModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

// Configuración de ChromaDB
// Dentro de Docker, usaremos el nombre del servicio 'chromadb' si está en la misma red
const chromaClient = new ChromaClient({
    path: process.env.CHROMA_URL || "http://localhost:8000"
});

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

app.post('/consultar', async (req, res) => {
    try {
        const { pregunta } = req.body;

        if (!pregunta) {
            return res.status(400).json({ error: "La pregunta es obligatoria en req.body.pregunta" });
        }

        console.log(`Procesando pregunta: "${pregunta}"`);

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

        // 6. Enviar respuesta
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

app.post('/ingestar', async (req, res) => {
    try {
        const { texto, nombreArchivo } = req.body;

        if (!texto || !nombreArchivo) {
            return res.status(400).json({ error: "texto y nombreArchivo son obligatorios" });
        }

        console.log(`Ingestando archivo: ${nombreArchivo}`);

        // 1. Obtener o crear la colección con la métrica coseno
        const collection = await chromaClient.getOrCreateCollection({
            name: "materiales_academicos",
            metadata: { "hnsw:space": "cosine" }
        });

        // 2. Generar embedding para el texto
        const embedding = await generateEmbedding(texto);

        // 3. Guardar en ChromaDB
        // Usamos un ID basado en el nombre del archivo y timestamp para evitar colisiones si se sube varias veces
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
 * Nuevo endpoint para ingestar archivos .md o .txt directamente
 */
app.post('/ingestar-archivo', upload.single('archivo'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "Por favor, sube un archivo (.md o .txt)" });
        }

        const nombreArchivo = req.file.originalname;
        const texto = req.file.buffer.toString('utf8');

        if (!texto.trim()) {
            return res.status(400).json({ error: "El archivo está vacío" });
        }

        console.log(`Ingestando archivo desde upload: ${nombreArchivo}`);

        // 1. Obtener o crear la colección
        const collection = await chromaClient.getOrCreateCollection({
            name: "materiales_academicos",
            metadata: { "hnsw:space": "cosine" }
        });

        // 2. Generar embedding
        const embedding = await generateEmbedding(texto);

        // 3. Guardar en ChromaDB
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
    console.log(`Servidor de consulta corriendo en puerto ${PORT}`);
});
