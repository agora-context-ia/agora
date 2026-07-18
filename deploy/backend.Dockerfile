FROM node:20-alpine AS build
WORKDIR /app
COPY apps/backend/package.json ./package.json
RUN npm install
COPY apps/backend/prisma ./prisma
RUN npx prisma generate
COPY apps/backend/tsconfig.json ./tsconfig.json
COPY apps/backend/src ./src
RUN npm run build

FROM build AS migration
CMD ["npx", "prisma", "migrate", "deploy"]

FROM node:20-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY apps/backend/package.json ./package.json
RUN npm install --omit=dev && npm cache clean --force
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=build /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=build /app/dist ./dist
COPY apps/backend/prisma ./prisma
USER node
EXPOSE 3000
CMD ["node", "dist/main.js"]
