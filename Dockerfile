FROM node:12.16.3

WORKDIR /usr/src/app

COPY . .

ENV SERVER_HOST localhost
ENV SERVER_PORT 3000

RUN npm i && npm run build-client && npm run build-server

EXPOSE 3000

CMD [ "npm", "start" ]
