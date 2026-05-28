FROM node:24.14.0-alpine AS build

WORKDIR /app
RUN chown -R node:node /app

USER node
RUN mkdir -p /app/dist/src
COPY --chown=node . /app

RUN npm install 

# should be removed if you are using custom plugins
RUN npm run init

RUN npm run build

FROM node:24.14.0-alpine

ENV PYTHONUNBUFFERED=1
RUN apk add --no-cache python3 py3-pip py3-ruamel.yaml git

WORKDIR /app
RUN mkdir -p /app/src/plugins

RUN chown -R node:node /app


COPY --from=build --chown=node /app/*.json /app/
COPY --from=build --chown=node /app/dist /app/dist
COPY --from=build --chown=node /app/node_modules /app/node_modules
COPY --from=build --chown=node /app/config /app/config
COPY --from=build --chown=node /app/.git /app/.git
COPY --from=build --chown=node /app/src/plugins /app/src/plugins


COPY entrypoint.py /app/entrypoint.py

USER node

EXPOSE 3001
CMD ["python", "entrypoint.py"]
