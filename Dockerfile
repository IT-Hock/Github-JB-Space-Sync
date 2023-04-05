FROM node:gallium-alpine3.17 AS builder

WORKDIR /usr/src/app

COPY package*.json ./
COPY tsconfig.json ./
COPY *.ts ./

RUN npm install

RUN npm run build

FROM node:gallium-alpine3.17

LABEL maintainer="Dominic Hock <d.hock@it-hock.de>"
LABEL version="1.0"
LABEL description="This is a Dockerfile for the GitHub Action to Space integration."

ENV NODE_ENV=production
ENV PORT=2652
ENV GITHUB_SECRET=""
ENV SPACE_URL=""
ENV SPACE_TOKEN=""
ENV SPACE_PROJECT=""
ENV SPACE_DEFAULT_STATUS=""

WORKDIR /usr/src/app
COPY package*.json ./

# From builder get all js files
COPY --from=builder /usr/src/app/*.js /usr/src/app/
COPY --from=builder /usr/src/app/node_modules /usr/src/app/node_modules

EXPOSE 2652

CMD [ "npm", "start" ]