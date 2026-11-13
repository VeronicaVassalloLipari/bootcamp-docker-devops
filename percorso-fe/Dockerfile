# syntax=docker/dockerfile:1.7

# percorso-fe/Dockerfile
# Stage 1: build con Node
FROM node:20.11.1-alpine3.19 AS builder
WORKDIR /app
COPY package*.json ./
# Cache mount BuildKit: i tarball npm restano tra le build, fuori dall'immagine.
RUN --mount=type=cache,target=/root/.npm,sharing=locked \
    npm ci
COPY . .
RUN npm run build
# Output: /app/dist

# Stage 2: runtime con Nginx
FROM nginx:1.27-alpine AS runtime
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -q --spider http://127.0.0.1/ || exit 1
CMD ["nginx", "-g", "daemon off;"]
