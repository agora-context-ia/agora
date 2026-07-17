# Production deployment on an Azure VPS

This directory runs Ágora behind a single Nginx gateway. PostgreSQL,
Redis, Ollama and the backend are reachable only through Docker's private
network; the host publishes only `HTTP_PORT`.

## Prepare the VM

Use Ubuntu 24.04 LTS with Docker Engine and the Compose plugin. In Azure,
allow inbound SSH (22) only from an administrative IP and HTTP/HTTPS
(80/443) from the internet. Do not expose ports 3000, 5432, 6379 or 11434.

Point the intended DNS A record to the VM public IP, clone the repository,
then create the secret environment:

```bash
chmod +x deploy/generate-env.sh
./deploy/generate-env.sh
nano deploy/.env.production
```

Set `NGINX_SERVER_NAME`, `FRONTEND_URL` and `CORS_ORIGIN` to the real
domain. Keep `COOKIE_SECURE=true` when the public endpoint uses HTTPS.

## Build and start

```bash
docker compose \
  --env-file deploy/.env.production \
  -f deploy/docker-compose.production.yml \
  up -d --build
```

The one-shot `migrate` service applies versioned Prisma migrations before
the API starts. Check status and logs with:

```bash
docker compose --env-file deploy/.env.production -f deploy/docker-compose.production.yml ps
docker compose --env-file deploy/.env.production -f deploy/docker-compose.production.yml logs -f backend nginx
```

## TLS

The included Nginx listens on HTTP so it also works behind Azure
Application Gateway or another TLS terminator. For a standalone VM,
terminate TLS using the host's Certbot/Nginx installation or extend the
gateway with mounted certificate files. Do not enable `COOKIE_SECURE=true`
until requests reach the application through HTTPS.

## Backups and secret handling

- Back up `postgres_data` daily and test restoration regularly.
- Back up `backend_uploads`; database-only backups do not contain source files.
- Keep `CREDENTIALS_ENCRYPTION_KEY` in Azure Key Vault and in a separate
  recovery location. Losing it makes stored organization AI keys unreadable.
- Never commit `.env.production`; it is ignored by Git and created mode 600.
- Prefer per-organization provider keys entered through the UI. Leave the
  server-wide Gemini/OpenAI/Anthropic fallbacks empty unless required.
- Pin container image versions/digests before a controlled production release.
- Configure disk monitoring: Ollama models, uploads and PostgreSQL all grow.

## Updating

```bash
git pull --ff-only
docker compose --env-file deploy/.env.production -f deploy/docker-compose.production.yml up -d --build
```

Take a database and uploads backup before every schema or application update.
