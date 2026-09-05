FROM node:24-bookworm-slim AS builder
WORKDIR /usr/src/app
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates python3 python-is-python3 && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:24-bookworm-slim AS runtime
ENV NODE_ENV=production
WORKDIR /usr/src/app
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates ffmpeg python3 python-is-python3 && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --from=builder /usr/src/app/dist ./dist
COPY Assets ./Assets
COPY www ./www
USER node
CMD ["node", "dist/index.js"]
