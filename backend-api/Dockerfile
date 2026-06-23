FROM node:18-alpine
RUN apk add --no-cache netcat-openbsd
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install --legacy-peer-deps
COPY . .
RUN npm run build
CMD ["node", "dist/main.js"]