#!/bin/sh

# URLs de los servicios en la red de Docker
API_CONVERTIDOR="http://convertidor:3002/convertir"
API_INGESTA_ARCHIVO="http://chatbot-consulta:3003/ingestar-archivo"

INPUT_DIR="/inputs"
OUTPUT_DIR="/outputs"

echo "Esperando a que los servicios estén listos..."
sleep 2

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

# Buscamos solo los archivos .md generados
if [ -z "$(ls -A "$OUTPUT_DIR"/*.md 2>/dev/null)" ]; then
    echo "No se encontraron archivos .md en $OUTPUT_DIR para ingestar."
else
    for md_file in "$OUTPUT_DIR"/*.md; do
        if [ -f "$md_file" ]; then
            md_filename=$(basename "$md_file")
            echo "Subiendo $md_filename a ChromaDB..."
            
            # Usamos el nuevo endpoint /ingestar-archivo que recibe el archivo directamente
            RESPONSE=$(curl -s -X POST -F "archivo=@$md_file" "$API_INGESTA_ARCHIVO")
            
            echo "Respuesta: $RESPONSE"
        fi
    done
fi

echo "--- Proceso de lote finalizado con éxito ---"
