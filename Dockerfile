# base image
FROM node:20.11.0-bookworm as base

RUN mkdir -p /app
WORKDIR /app

# Install app dependencies
COPY package.json /app/package.json
COPY yarn.lock /app/yarn.lock
COPY packages/server/package.json /app/packages/server/package.json
COPY packages/core/package.json /app/packages/core/package.json
COPY lerna.json /app/lerna.json
RUN yarn install

# Bundle app source
COPY . /app
RUN cp /app/testconfig/.env /app/packages/server/
RUN cp /app/testconfig/config.json /app/
RUN yarn bootstrap
RUN yarn build

EXPOSE 3000

CMD [ "yarn", "start" ]
