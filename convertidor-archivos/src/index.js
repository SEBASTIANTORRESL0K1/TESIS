const express = require('express');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const fs = require('fs');
const path = require('path');

const app = express();
const port = process.env.PORT || 3002;

// Crear carpeta de salidas si no existe (relativa a la raíz del proyecto)
const outputDir = path.join(process.cwd(), 'outputs');
console.log('Ruta de carpeta de salidas:', outputDir);

if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

// Configuración de Multer para recibir archivos en memoria (no satura el disco)
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Función para limpiar el texto y ahorrar tokens (sin destruir la estructura de párrafos)
function limpiarTexto(texto) {
    return texto
        .replace(/\r\n/g, '\n')       // Normaliza saltos de línea
        .replace(/[ \t]+/g, ' ')      // Elimina espacios dobles o tabulaciones
        .replace(/\n\s*\n\s*\n+/g, '\n\n') // Máximo dos saltos de línea seguidos
        .trim();                      // Quita espacios al inicio y final
}

// Endpoint de salud
app.get('/health', (req, res) => {
    res.status(200).send('OK');
});

// Endpoint principal de conversión
app.post('/convertir', upload.single('archivo'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Por favor, sube un archivo.' });
        }

        const mimeType = req.file.mimetype;
        let textoExtraido = '';
        let esMarkdownNativo = false;

        // 1. Procesar si es PDF
        if (mimeType === 'application/pdf') {
            const data = await pdfParse(req.file.buffer);
            textoExtraido = data.text;
        } 
        // 2. Procesar si es Word (.docx)
        else if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
            // Usamos convertToMarkdown para preservar negritas, listas y encabezados
            const data = await mammoth.convertToMarkdown({ buffer: req.file.buffer });
            textoExtraido = data.value;
            esMarkdownNativo = true;
        } 
        // Tipo de archivo no soportado
        else {
            return res.status(400).json({ error: 'Formato no soportado. Sube un PDF o un archivo .docx' });
        }

        // 3. Limpiar el texto (con cuidado si ya es MD)
        let textoFinal = '';
        if (esMarkdownNativo) {
            // Si ya es Markdown, solo quitamos espacios innecesarios al final de cada línea
            textoFinal = textoExtraido.split('\n').map(line => line.trimEnd()).join('\n').trim();
        } else {
            // Si es texto plano (PDF), usamos la limpieza normal
            textoFinal = limpiarTexto(textoExtraido);
        }

        // 4. Generar archivo .md con estructura
        const nombreOriginal = path.parse(req.file.originalname).name;
        const nombreArchivoMd = `${nombreOriginal}-${Date.now()}.md`;
        const rutaCompleta = path.join(outputDir, nombreArchivoMd);
        
        console.log('Intentando guardar archivo en:', rutaCompleta);
        
        // Si no es MD nativo, le ponemos el título
        const contenidoMd = esMarkdownNativo ? textoFinal : `# ${nombreOriginal}\n\n${textoFinal}`;
        
        try {
            await fs.promises.writeFile(rutaCompleta, contenidoMd, 'utf8');
            console.log('Archivo guardado exitosamente');
        } catch (writeError) {
            console.error('Error al escribir el archivo:', writeError);
        }

        // Responder con la ruta y el contenido
        res.json({
            ruta: `outputs/${nombreArchivoMd}`,
            contenido: textoFinal
        });

    } catch (error) {
        console.error('Error al procesar el archivo:', error);
        res.status(500).json({ error: 'Error interno al procesar el archivo.' });
    }
});

app.listen(port, () => {
    console.log(`Servidor de conversión corriendo en http://localhost:${port}`);
});