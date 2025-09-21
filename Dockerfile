FROM node:18-alpine
WORKDIR /app

COPY package*.json ./

RUN npm ci --only=production

COPY . .

ARG GIT_SHA=dev
ENV GIT_SHA=$GIT_SHA

EXPOSE 8080
CMD ["node", "index.js"]
