# Documentación de la API - Convertidor de Archivos

Esta API se encarga de transformar archivos físicos (PDF y Word) en texto plano con formato Markdown, limpiando el contenido para optimizar su procesamiento posterior.

## Resumen de Endpoints

| Método | Ruta | Descripción |
| :--- | :--- | :--- |
| `POST` | `/convertir` | Convierte un archivo PDF o .docx a Markdown (.md). |
| `GET` | `/health` | Verifica el estado del servicio. |

---

## 1. Convertir Archivo
Recibe un archivo, extrae su texto, lo limpia y genera un archivo `.md` en el servidor.

*   **Ruta:** `/convertir`
*   **Método:** `POST`
*   **Headers:** `Content-Type: multipart/form-data`

### Body (Multipart Form Data)
| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| `archivo` | File | El archivo a convertir. Formatos soportados: `.pdf`, `.docx`. |

### Respuesta de Éxito (200 OK)
```json
{
  "ruta": "outputs/nombre-archivo-1779066203833.md",
  "contenido": "# Título del Documento\n\nContenido extraído y limpio..."
}
```

### Ejemplo con CURL
```bash
curl -X POST http://localhost:3002/convertir \
     -F "archivo=@./mi-documento.pdf"
```

---

## 2. Estado del Servicio
Verifica si el servidor de conversión está activo.

*   **Ruta:** `/health`
*   **Método:** `GET`

### Respuesta de Éxito (200 OK)
```text
OK
```

### Ejemplo con CURL
```bash
curl http://localhost:3002/health
```
