#!/bin/sh
set -e

if [ -z "$BACKEND_URL" ]; then
  echo "ERROR: BACKEND_URL no está definida."
  echo "Ejemplo: BACKEND_URL=https://api.tudominio.com"
  exit 1
fi

export BACKEND_URL="${BACKEND_URL%/}"
echo "Proxy /api -> ${BACKEND_URL}/api/"

envsubst '${BACKEND_URL}' < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf
exec nginx -g 'daemon off;'
