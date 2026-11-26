# Construir desde la raíz del repositorio: docker build -f apps/api/Dockerfile .
FROM node:22-alpine AS build
WORKDIR /repo
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
COPY packages/design/package.json packages/design/
RUN npm ci -w apps/api --include-workspace-root=false
COPY apps/api apps/api
RUN cd apps/api && npx prisma generate && npx nest build

FROM node:22-alpine
WORKDIR /repo
ENV NODE_ENV=production
COPY --from=build /repo/node_modules node_modules
COPY --from=build /repo/apps/api/dist apps/api/dist
COPY --from=build /repo/apps/api/prisma apps/api/prisma
COPY --from=build /repo/apps/api/package.json apps/api/package.json
COPY --from=build /repo/apps/api/tsconfig.json apps/api/tsconfig.json
WORKDIR /repo/apps/api
EXPOSE 4000
VOLUME /repo/apps/api/uploads
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"]
