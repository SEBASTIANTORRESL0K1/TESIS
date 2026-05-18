# Usamos una versión slim de Node.js (más compatible que Alpine para ciertas librerías)
FROM node:20-slim

# Instalar dependencias del sistema necesarias (opcional pero recomendado)
RUN apt-get update && apt-get install -y \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Crear directorio de trabajo
WORKDIR /usr/src/app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias
RUN npm install --omit=dev --legacy-peer-deps

# Copiar el código fuente
COPY index.js .

# Exponer el puerto del servicio
EXPOSE 3003

# Comando para arrancar la aplicación
CMD [ "npm", "start" ]
