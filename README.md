REST API facade facilitating the interactions with the Elrond blockchain.

## Quick start

1. Run `npm install` in the project directory
2. Optionally make edits to `config.yaml` or create `config.custom.yaml`
3. Run `npm run init` in the project directory (to create default plugins structure)

## Dependencies

1. Redis Server is required to be installed [docs](https://redis.io/).
2. MySQL Server is required to be installed [docs](https://dev.mysql.com/doc/refman/8.0/en/installing.html). This can be avoided by adding in the .env file the following: `PERSISTENCE=passthrough`.
3. ffmpeg is required to be installed [docs](https://www.ffmpeg.org/download.html).

You can use `docker-compose up` in a separate terminal to use a local docker container for all these dependencies.

After running the sample, you can stop the Docker container with `docker-compose down`

## Available Scripts

This is an Elrond project built on Nest.js framework.

### `npm run start:prod`

​
Runs the app in the production mode.
Make requests to [http://localhost:3001](http://localhost:3001).

## Running the app

```bash
# development watch mode
$ npm run start:watch

# development debug mode
$ npm run start:debug

# development mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

Requests can be made to http://localhost:4001. The app will reload when you'll make edits (if opened in watch mode). You will also see any lint errors in the console.​

### `npm run test`

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```
