#!/bin/sh
set -eu

output="$(dirname "$0")/.env.production"
if [ -e "$output" ]; then
  echo "Refusing to overwrite $output" >&2
  exit 1
fi

postgres_password="$(openssl rand -base64 36 | tr -d '\n')"
redis_password="$(openssl rand -base64 36 | tr -d '\n')"
encryption_key="$(openssl rand -hex 32)"

umask 077
sed \
  -e "s|CHANGE_ME_STRONG_DATABASE_PASSWORD|$postgres_password|" \
  -e "s|CHANGE_ME_STRONG_REDIS_PASSWORD|$redis_password|" \
  -e "s|CHANGE_ME_64_HEX_CHARACTERS|$encryption_key|" \
  "$(dirname "$0")/.env.production.example" > "$output"

echo "Created $output with mode 600. Set the real domain and optional provider keys before deployment."
