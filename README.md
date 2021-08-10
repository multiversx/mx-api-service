REST API facade facilitating the interactions with the Elrond blockchain.

## Quick start

1. Run `npm install` in the project directory
2. Optionally make edits to `config.yaml` or create `config.custom.yaml`

## Available Scripts

This is an Elrond project built on Nest.js framework.


### `npm run start:prod`

​
Runs the app in the production mode.
Make requests to [http://localhost:3001](http://localhost:3001).

Redis Server is required to be installed.

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

