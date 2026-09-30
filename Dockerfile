# Image produksi Takaran: satu aplikasi Next.js (mode standalone).
# Build dari akar repo: docker build -t takaran .

FROM node:22-alpine AS build
ARG APP_URL=http://localhost:3000
ENV APP_URL=${APP_URL}
RUN corepack enable
WORKDIR /repo
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages ./packages
COPY apps/site/package.json ./apps/site/package.json
RUN pnpm install --frozen-lockfile
COPY apps/site ./apps/site
RUN pnpm --filter @takaran/site build

FROM node:22-alpine AS runtime
ENV NODE_ENV=production PORT=3000 HOSTNAME=0.0.0.0 NEXT_TELEMETRY_DISABLED=1
WORKDIR /app
COPY --from=build /repo/apps/site/.next/standalone ./
COPY --from=build /repo/apps/site/.next/static ./apps/site/.next/static
COPY --from=build /repo/apps/site/public ./apps/site/public
# Migrasi SQL dijalankan saat server menyala (src/instrumentation.ts).
COPY --from=build /repo/apps/site/drizzle ./apps/site/drizzle
WORKDIR /app/apps/site
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s \
  CMD wget -qO- http://127.0.0.1:3000/kebijakan-privasi >/dev/null || exit 1
CMD ["node", "server.js"]
