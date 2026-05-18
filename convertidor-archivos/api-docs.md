# Documentación de API - Extractor de Texto Académico

## `POST /convertir`

Convierte archivos PDF o Word (.docx) a texto plano optimizado. El servicio se encarga de extraer el texto y limpiarlo (remueve espacios dobles, tabulaciones y saltos de línea consecutivos) para ahorrar tokens y facilitar su ingesta en una Base de Datos Vectorial.

### Request

- **URL:** `/convertir`
- **Método:** `POST`
- **Content-Type:** `multipart/form-data`

### Parámetros (Body)

| Campo   | Tipo | Requerido | Descripción |
| :------ | :--- | :-------- | :---------- |
| `archivo` | File | Sí        | Documento a procesar. Soporta los MIME types `application/pdf` y `application/vnd.openxmlformats-officedocument.wordprocessingml.document` (.docx). |

---

### Respuestas (Responses)

#### ✅ Éxito (200 OK)

Devuelve la ruta del archivo `.md` generado y su contenido limpio.

```json
{
    "ruta": "outputs/documento_tesis-1715856000000.md",
    "contenido": "Texto limpio y normalizado extraído del documento..."
}
```

#### ❌ Error - Archivo faltante (400 Bad Request)

```json
{
    "error": "Por favor, sube un archivo."
}
```

#### ❌ Error - Formato inválido (400 Bad Request)

```json
{
    "error": "Formato no soportado. Sube un PDF o un archivo .docx"
}
```

#### ❌ Error del servidor (500 Internal Server Error)

```json
{
    "error": "Error interno al procesar el archivo."
}
```