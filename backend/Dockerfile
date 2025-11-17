# syntax=docker/dockerfile:1.7
FROM node:20.11-slim AS base

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY tsconfig.json ./
COPY app.ts ./
COPY src ./src

RUN npm run build

FROM node:20.11-slim AS production

ENV NODE_ENV=production
WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=base /app/dist ./dist

EXPOSE 5000

CMD ["node", "dist/app.js"]
