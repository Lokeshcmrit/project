FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci
COPY . .
RUN npx prisma generate
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
COPY package*.json ./
COPY prisma ./prisma/
# Install ALL deps (including devDeps) so ts-node is available for seed
RUN npm ci
RUN npx prisma generate
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
RUN mkdir -p /app/uploads

EXPOSE ${PORT:-4000}
CMD ["sh", "-c", "npx prisma db push && npx ts-node --transpile-only prisma/seed.ts && node dist/src/main"]
