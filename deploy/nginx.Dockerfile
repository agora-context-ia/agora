FROM node:20-alpine AS frontend-build
RUN corepack enable
WORKDIR /workspace
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/shared-types/package.json ./packages/shared-types/package.json
COPY packages/shared-types/src ./packages/shared-types/src
COPY apps/frontend/package.json ./apps/frontend/package.json
RUN pnpm install --frozen-lockfile --filter @contexthub-ai/frontend...
COPY apps/frontend ./apps/frontend
ARG VITE_API_URL=
ENV VITE_API_URL=${VITE_API_URL}
RUN pnpm --filter @contexthub-ai/frontend build

FROM nginx:1.27-alpine
COPY --from=frontend-build /workspace/apps/frontend/dist /usr/share/nginx/html
COPY deploy/nginx/default.conf.template /etc/nginx/templates/default.conf.template
COPY deploy/nginx/40-render-config.sh /docker-entrypoint.d/40-render-config.sh
RUN chmod +x /docker-entrypoint.d/40-render-config.sh
EXPOSE 80
