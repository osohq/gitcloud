FROM node:18

RUN apt-get update && apt-get install -y \
    sqlite3 \
    && rm -rf /var/lib/apt/lists/*
RUN mkdir -p /home/node/app/node_modules && chown -R node:node /home/node/app
WORKDIR /home/node/app
COPY package*.json ./

USER node
RUN yarn install
COPY --chown=node:node . .
EXPOSE 5001
CMD [ "yarn", "start" ]
