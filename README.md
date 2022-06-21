Unified REST API facade for providing data related to the Elrond blockchain.

## Quick start

1. Run `npm install` in the project directory
2. Optionally make edits to `config.yaml` or create `config.custom.yaml`
3. Run `npm run init` in the project directory (to create default plugins structure)

## Dependencies

1. Redis Server is required to be installed [docs](https://redis.io/).
2. MySQL Server is required to be installed [docs](https://dev.mysql.com/doc/refman/8.0/en/installing.html). This can be avoided by adding in the config file the following: `database.enabled: false`.
3. MongoDB Server is required to be installed [docs](https://www.mongodb.com/docs/manual/installation). This can be avoided by adding in the config file the following: `database.enabled: false`.
4. ffmpeg is required to be installed [docs](https://www.ffmpeg.org/download.html).

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

It depends on the following external systems:
- gateway: 
  - provides access to node information, such as network settings, account balance, sending transactions, etc
  - docs: https://docs.elrond.com/sdk-and-tools/proxy/
- index: 
  - a database that indexes data that can be queries, such as transactions, blocks, nfts, etc.
  - docs: https://docs.elrond.com/sdk-and-tools/elastic-search/
- delegation: used to fetch providers list from the delegation API

It uses on the following internal systems:
- redis: used to cache various data, for performance purposes
- rabbitmq: pub/sub for sending mainly NFT process information from the transaction processor instance to the queue worker instance

An API instance can be started with the following behavior:
- public API: provides REST API for the consumers
- private API: used to report prometheus metrics & health checks
- transaction processor & completed: fetches real-time transactions & logs from the blockchain; takes action based on various events, such as clearing cache values and publishing events on a queue
- cache warmer: used to proactively fetch data & pushes it to cache, to improve performance & scalability 
- elastic updater: used to attach various extra information to items in the elasticsearch, for not having to fetch associated data from other external systems when performing listing requests
- events notifier: perform various decisions based on incoming logs & events

It depends on the following optional external systems:
- events notifier rabbitmq: queue that pushes logs & events which are handled internally e.g. to trigger NFT media fetch
- data: provides eGLD price information for transactions
- maiar exchange: provides price information regarding various tokens listed on the maiar exchange
- ipfs: ipfs gateway for fetching mainly NFT metadata & media files
- media: ipfs gateway which will be used as prefix for NFT media & metadata returned in the NFT details
- media internal: caching layer for ipfs data to fetch from a centralized system such as S3 for performance reasons
- AWS S3: used to process newly minted NFTs & uploads their thumbnails
- github: used to fetch provider profile & node information from github

It uses the following optional internal systems:
- mysql database: used to store mainly NFT media & metadata information
- mongo database: used to store mainly NFT media & metadata information