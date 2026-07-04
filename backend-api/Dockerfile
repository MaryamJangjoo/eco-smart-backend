FROM node:18-alpine

RUN apk add --no-cache netcat-openbsd

WORKDIR /usr/src/app

COPY . .

RUN npm run build

CMD ["node", "dist/main.js"]