# Usamos una versión ligera de Node.js
FROM docker.io/library/node:20-alpine

# Crear directorio de trabajo
WORKDIR /usr/src/app

# Copiar archivos de dependencias
COPY package*.json ./

# Cambiamos npm ci por npm install optimizado para producción
RUN apk add --no-cache curl && npm install --omit=dev

# Copiar el código fuente
COPY src/ ./src/

# Exponer el puerto del servicio
EXPOSE 3002

# Comando para arrancar la aplicación
CMD [ "npm", "start" ]