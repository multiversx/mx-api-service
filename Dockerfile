FROM node:18.19-alpine

WORKDIR /app
RUN chown -R node:node /app

USER node
RUN mkdir -p /app/dist/src
COPY --chown=node . /app

RUN npm install
RUN npm run init
RUN npm run build

EXPOSE 3001
RUN chmod +x entrypoint.sh

CMD ["./entrypoint.sh"]
