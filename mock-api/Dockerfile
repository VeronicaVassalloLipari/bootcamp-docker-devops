# syntax=docker/dockerfile:1.7

# mock-api/Dockerfile
FROM node:20.11.1-alpine3.19
WORKDIR /app
COPY package*.json ./
# Cache mount BuildKit: i tarball npm restano tra le build, fuori dall'immagine.
RUN --mount=type=cache,target=/root/.npm,sharing=locked \
    npm ci --omit=dev
COPY src ./src
ENV NODE_ENV=production
ENV PORT=80
USER node
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -q --spider http://localhost:80/healthz || exit 1
CMD ["node", "src/index.js"]
