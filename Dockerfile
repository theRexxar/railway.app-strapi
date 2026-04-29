# Stage 1: Install dependencies
FROM node:22-alpine AS deps

RUN apk add --no-cache python3 make g++

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci --ignore-scripts && npm cache clean --force

# Stage 2: Build
FROM deps AS build

COPY . .
RUN npm run generate:docs
RUN npm run build

# Prune dev dependencies after build
RUN rm -rf node_modules && npm ci --omit=dev --ignore-scripts && npm cache clean --force

# Stage 3: Production
FROM node:22-alpine AS production

RUN apk add --no-cache tini

WORKDIR /app

RUN addgroup -g 1001 -S strapi && adduser -S -u 1001 -G strapi strapi

COPY --from=build --chown=strapi:strapi /app ./

USER strapi

ENV NODE_ENV=production

EXPOSE 1337

ENTRYPOINT ["tini", "--"]
CMD ["npm", "run", "start"]