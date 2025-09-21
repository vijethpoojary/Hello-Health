FROM node:18-alpine
WORKDIR /app

# copy package files first (cache)
COPY package*.json ./

# install only prod deps in image (tests run in CI before build)
RUN npm ci --only=production

# copy app
COPY . .

# build arg -> baked into ENV
ARG GIT_SHA=dev
ENV GIT_SHA=$GIT_SHA

EXPOSE 8080
CMD ["node", "index.js"]
