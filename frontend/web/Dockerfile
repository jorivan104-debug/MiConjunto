FROM node:20-alpine AS build
WORKDIR /app

# Pasar en Dokploy como Build Argument: VITE_API_URL=https://api.tudominio.com
ARG VITE_API_URL=
ENV VITE_API_URL=$VITE_API_URL

COPY package*.json ./
RUN npm ci || npm install
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf.template /etc/nginx/templates/default.conf.template
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh
EXPOSE 80
CMD ["/docker-entrypoint.sh"]
