# Étape 1 : Image de base légère
FROM node:20-alpine

WORKDIR /app

# Étape 3 : Copie sélective (optimise le cache Docker)
COPY package.json package-lock.json ./

RUN npm install 

COPY . .
#Cela indique à Docker que ton container “écoute” sur le port
EXPOSE 5173

CMD ["npm","run","dev","--", "--host", "0.0.0.0", "--port", "5173"]