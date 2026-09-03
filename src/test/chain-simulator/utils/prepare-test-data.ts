import axios from 'axios';
import { config } from '../config/env.config';
import { fundAddress, issueMultipleEsdts, issueMultipleMetaESDTCollections, issueMultipleNftsCollections } from './chain.simulator.operations';
import { ChainSimulatorUtils } from './test.utils';

// the api serves most of this from caches the cache warmer fills on its own crons, so what the chain
// reports says nothing about what the tests will see. wait on the api's own view instead, per kind of
// data, rather than on a single interval that has to be long enough for the slowest of them
async function waitForApi(description: string, url: string, isReady: (data: any) => boolean, timeoutMs: number = 180000) {
  const deadline = Date.now() + timeoutMs;
  let last: any = 'no response yet';

  while (Date.now() < deadline) {
    try {
      last = (await axios.get(url)).data;
      if (isReady(last)) {
        console.log(`✓ ${description}`);
        return;
      }
    } catch (error: any) {
      last = error.message;
    }

    await new Promise((resolve) => setTimeout(resolve, 5000));
  }

  throw new Error(`${description}: still not ready after ${timeoutMs}ms. ${url} last returned ${JSON.stringify(last).slice(0, 300)}`);
}

async function prepareTestData() {
  try {
    console.log('Starting test data preparation...');

    console.log('Waiting for epoch 2...');
    await ChainSimulatorUtils.waitForEpoch(2);
    console.log('✓ Chain simulator reached epoch 2');

    await fundAddress(config.chainSimulatorUrl, config.aliceAddress);
    console.log('✓ Funded address');

    await issueMultipleEsdts(config.chainSimulatorUrl, config.aliceAddress, 5);
    console.log('✓ Issued ESDTs');

    await issueMultipleNftsCollections(config.chainSimulatorUrl, config.aliceAddress, 2, 5, 'both');
    console.log('✓ Issued NFT collections');

    await issueMultipleMetaESDTCollections(config.chainSimulatorUrl, config.aliceAddress, 2, 5);
    console.log('✓ Issued Meta-ESDT collections');

    await ChainSimulatorUtils.deployPingPongSc(config.aliceAddress);
    console.log('✓ Deployed PingPong smart contract');

    await waitForApi('Tokens listed by the API', `${config.apiServiceUrl}/tokens/count`, count => count >= 5);
    await waitForApi('Tokens listed on the issuer account', `${config.apiServiceUrl}/accounts/${config.aliceAddress}/tokens/count`, count => count >= 5);
    // 2 NFT + 2 SFT collections, five items each; the meta-esdt ones come on top of that
    await waitForApi('Collections listed by the API', `${config.apiServiceUrl}/collections/count`, count => count >= 4);
    await waitForApi('NFTs listed by the API', `${config.apiServiceUrl}/nfts/count`, count => count >= 20);

    // node and validator statistics are filled in by warmers on a one minute cron, and shards are
    // derived from them. until those have run at least once, /shards is empty and nodes come back
    // with a null rating and no status
    await waitForApi('Shards reported by the API', `${config.apiServiceUrl}/shards`, shards => shards.length >= 4);
    await waitForApi('Node ratings filled in by the API', `${config.apiServiceUrl}/nodes?size=1`, nodes => nodes.length > 0 && nodes[0].status !== undefined && nodes[0].tempRating !== null);

    console.log('Test data preparation completed successfully!');
  } catch (error) {
    console.error('Error preparing test data:', error);
    process.exit(1);
  }
}

void prepareTestData();
