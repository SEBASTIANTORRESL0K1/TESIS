# Documentación de la API - Chatbot Consulta

Esta API gestiona la interacción con el modelo de lenguaje Gemini y la base de datos vectorial ChromaDB para realizar consultas académicas basadas en documentos indexados.

## Resumen de Endpoints

| Método | Ruta | Descripción |
| :--- | :--- | :--- |
| `POST` | `/consultar` | Realiza una pregunta al chatbot basada en el contexto de los documentos. |
| `POST` | `/ingestar` | Ingesta texto plano directamente en la base de datos. |
| `POST` | `/ingestar-archivo` | Ingesta el contenido de un archivo (.md o .txt) en la base de datos. |
| `GET` | `/health` | Verifica el estado del servicio. |

---

## 1. Consultar Chatbot
Realiza una consulta semántica a ChromaDB y genera una respuesta usando Gemini.

*   **Ruta:** `/consultar`
*   **Método:** `POST`
*   **Headers:** `Content-Type: application/json`

### Body (JSON)
```json
{
  "pregunta": "¿Qué es el Path Traversal?"
}
```

### Respuesta de Éxito (200 OK)
```json
{
  "respuesta": "El Path Traversal es una vulnerabilidad que permite acceder a archivos fuera del directorio autorizado...",
  "fuentes": [
    "Documentación-LaboratorioPSW-DSS-25.md"
  ]
}
```

### Ejemplo con CURL
```bash
curl -X POST http://localhost:3003/consultar \
     -H "Content-Type: application/json" \
     -d '{"pregunta": "¿Qué es el Path Traversal?"}'
```

---

## 2. Ingestar Texto
Guarda un fragmento de texto directamente en la colección de ChromaDB.

*   **Ruta:** `/ingestar`
*   **Método:** `POST`
*   **Headers:** `Content-Type: application/json`

### Body (JSON)
```json
{
  "texto": "Este es el contenido que quiero guardar.",
  "nombreArchivo": "mi-nota.txt"
}
```

### Respuesta de Éxito (200 OK)
```json
{
  "status": "ok",
  "message": "Archivo mi-nota.txt ingestada correctamente",
  "id": "mi-nota.txt-1779066207281"
}
```

### Ejemplo con CURL
```bash
curl -X POST http://localhost:3003/ingestar \
     -H "Content-Type: application/json" \
     -d '{"texto": "Contenido de prueba", "nombreArchivo": "prueba.txt"}'
```

---

## 3. Ingestar Archivo
Sube un archivo físico (.md o .txt) para ser procesado e indexado.

*   **Ruta:** `/ingestar-archivo`
*   **Método:** `POST`
*   **Headers:** `Content-Type: multipart/form-data`

### Body (Multipart Form Data)
| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| `archivo` | File | El archivo .md o .txt a subir. |

### Respuesta de Éxito (200 OK)
```json
{
  "status": "ok",
  "message": "Archivo notas.md ingestada correctamente",
  "id": "notas.md-1779066207281"
}
```

### Ejemplo con CURL
```bash
curl -X POST http://localhost:3003/ingestar-archivo \
     -F "archivo=@./mi-archivo.md"
```

---

## 4. Estado del Servicio
Verifica si el servicio está arriba.

*   **Ruta:** `/health`
*   **Método:** `GET`

### Respuesta de Éxito (200 OK)
```json
{
  "status": "ok",
  "service": "chatbot-consulta"
}
```

### Ejemplo con CURL
```bash
curl http://localhost:3003/health
```
