# Imagen alternativa si en Dokploy eliges builder Docker en lugar de Nixpacks.
# Contexto: raíz del repositorio.

FROM node:20-bookworm-slim
WORKDIR /app

COPY app/package.json app/package-lock.json ./
RUN npm ci

COPY app/ ./
RUN npm run build

ENV NODE_ENV=production

EXPOSE 3000
ENV HOSTNAME=0.0.0.0
ENV PORT=3000

CMD ["npm", "start"]
