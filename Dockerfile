# Skolappar: Vite frontend + a small Node server (node:sqlite, no runtime npm dependencies).

# --- Build the frontend ---
FROM node:24-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY . .
RUN npm run build

# --- Runtime ---
FROM node:24-alpine
ENV NODE_ENV=production \
    PORT=8080 \
    DATA_DIR=/data \
    STATIC_DIR=/app/dist
WORKDIR /app
COPY --from=build /app/dist ./dist
COPY server ./server
RUN rm -rf ./server/test \
 && mkdir -p /data && chown 10001:10001 /data
USER 10001:10001
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s \
  CMD wget -qO- "http://127.0.0.1:${PORT}/healthz" > /dev/null || exit 1
CMD ["node", "--disable-warning=ExperimentalWarning", "server/index.mjs"]
