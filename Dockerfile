FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache build-base gcc autoconf automake zlib-dev libpng-dev vips-dev git

COPY package.json yarn.lock ./

RUN yarn install --frozen-lockfile

COPY . .

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=8080
ENV URL=https://cms.jaripmi.info
ENV ADMIN_URL=https://cms.jaripmi.info/admin
ENV STRAPI_ADMIN_BACKEND_URL=https://cms.jaripmi.info

RUN yarn build

EXPOSE 8080

CMD ["yarn", "start"]
