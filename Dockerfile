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
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates ffmpeg python3 python3-pip python3-venv python-is-python3 && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --from=builder /usr/src/app/dist ./dist
COPY Assets ./Assets
COPY www ./www
COPY src/services/music/remix/worker ./src/services/music/remix/worker
RUN python3 -m venv /usr/src/app/.venv && \
    /usr/src/app/.venv/bin/pip install --no-cache-dir --upgrade pip && \
    /usr/src/app/.venv/bin/pip install --no-cache-dir torch torchaudio --index-url https://download.pytorch.org/whl/cpu && \
    /usr/src/app/.venv/bin/pip install --no-cache-dir -r ./src/services/music/remix/worker/requirements.txt && \
    /usr/src/app/.venv/bin/pip install --no-cache-dir diffq && \
    mkdir -p .cache && chown -R node:node /usr/src/app/.venv .cache
USER node
CMD ["node", "dist/index.js"]
