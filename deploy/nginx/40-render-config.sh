#!/bin/sh
set -eu
envsubst '${NGINX_SERVER_NAME}' \
  < /etc/nginx/templates/default.conf.template \
  > /etc/nginx/conf.d/default.conf
