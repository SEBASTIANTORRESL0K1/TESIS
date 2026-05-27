#!/bin/sh

# URLs de los servicios en la red de Docker
API_CONVERTIDOR="http://convertidor:3002/convertir"
API_INGESTA_ARCHIVO="http://chatbot-consulta:3003/ingestar-archivo"

INPUT_DIR="/inputs"
OUTPUT_DIR="/outputs"

echo "Esperando a que los servicios estén listos..."
sleep 2

# --- FASE DE LIMPIEZA ---
echo "Limpiando archivos antiguos en $OUTPUT_DIR..."
rm -f "$OUTPUT_DIR"/* 2>/dev/null
echo "✓ Carpeta de salidas limpia."
echo "-----------------------------------"

# --- FASE 1: CONVERSIÓN ---
echo "--- FASE 1: Convirtiendo archivos de $INPUT_DIR a Markdown ---"

if [ -z "$(ls -A "$INPUT_DIR" 2>/dev/null)" ]; then
    echo "No hay archivos para convertir en $INPUT_DIR"
else
    for file in "$INPUT_DIR"/*; do
        if [ -f "$file" ]; then
            filename=$(basename "$file")
            echo "Convirtiendo $filename..."
            
            # El convertidor procesa el archivo y lo guarda automáticamente en su propia carpeta 'outputs'
            # que está compartida con este script a través del volumen /outputs
            curl -s -X POST -F "archivo=@$file" "$API_CONVERTIDOR" > /dev/null
            
            if [ $? -eq 0 ]; then
                echo "✓ $filename convertido."
            else
                echo "✗ Error al convertir $filename"
            fi
        fi
    done
fi

echo "Fase de conversión completada."
echo "-----------------------------------"

# --- FASE 2: INGESTA ---
echo "--- FASE 2: Ingestando archivos .md de $OUTPUT_DIR en ChromaDB ---"

# Pequeña espera para asegurar que los últimos archivos se escribieron en disco
sleep 1

# 1. Obtener Token de Autenticación
echo "Obteniendo token de autenticación para el procesador de lotes..."
API_AUTH="http://chatbot-consulta:3003/auth/login"
AUTH_RESPONSE=$(curl -s -X POST -H "Content-Type: application/json" -d '{"email":"admin@tesis.com", "password":"admin123"}' "$API_AUTH")

TOKEN=$(echo "$AUTH_RESPONSE" | jq -r '.token // empty')

if [ -z "$TOKEN" ] || [ "$TOKEN" = "null" ]; then
    echo "✗ Error de autenticación: No se pudo obtener el token JWT."
    echo "Respuesta de Auth: $AUTH_RESPONSE"
    exit 1
fi

echo "✓ Autenticado correctamente como Administrador."
echo "-----------------------------------"

# Buscamos solo los archivos .md generados
if [ -z "$(ls -A "$OUTPUT_DIR"/*.md 2>/dev/null)" ]; then
    echo "No se encontraron archivos .md en $OUTPUT_DIR para ingestar."
else
    for md_file in "$OUTPUT_DIR"/*.md; do
        if [ -f "$md_file" ]; then
            md_filename=$(basename "$md_file")
            echo "Subiendo $md_filename a ChromaDB..."
            
            # Usamos el nuevo endpoint /ingestar-archivo que recibe el archivo directamente con token JWT
            RESPONSE=$(curl -s -X POST -H "Authorization: Bearer $TOKEN" -F "archivo=@$md_file" "$API_INGESTA_ARCHIVO")
            
            echo "Respuesta: $RESPONSE"
            
            # Verificar si la respuesta contiene un error para alertar al usuario
            if echo "$RESPONSE" | grep -q '"error"'; then
                echo "✗ Error al ingestar $md_filename"
            else
                echo "✓ $md_filename ingestado con éxito."
            fi

            # Esperamos 3 segundos entre peticiones para evitar la cuota 429 (Too Many Requests) de la API de Gemini
            echo "Esperando 3 segundos para respetar el límite de peticiones de la API..."
            sleep 3
            echo "-----------------------------------"
        fi
    done
fi

echo "--- Proceso de lote finalizado con éxito ---"
