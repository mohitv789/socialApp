#!/bin/sh
set -e

# Defaults if not provided
: "${APP_UPSTREAM:=backend_ea:8000}"
: "${WS_UPSTREAM:=websockets:8080}"

# substitute env vars into the final nginx config
envsubst '${APP_UPSTREAM} ${WS_UPSTREAM}' < /etc/nginx/default.conf.tpl > /etc/nginx/conf.d/default.conf

# ensure static dir exists (mounted volume may be empty)
mkdir -p /vol/static
chmod 755 /vol/static

# print the generated config for debugging (optional)
echo "----- Generated nginx config -----"
cat /etc/nginx/conf.d/default.conf
echo "----------------------------------"

# start nginx in foreground (as the default user of the image)
exec nginx -g 'daemon off;'
