import axios from 'axios';
import { config } from '../config/env.config';
import { fundAddress, issueMultipleEsdts, issueMultipleMetaESDTCollections, issueMultipleNftsCollections } from './chain.simulator.operations';
import { ChainSimulatorUtils } from './test.utils';

async function waitForApi(description: string, url: string, expected: number, timeoutMs: number = 180000) {
  const deadline = Date.now() + timeoutMs;
  let last = 0;

  while (Date.now() < deadline) {
    try {
      last = (await axios.get(url)).data;
      if (last >= expected) {
        console.log(`✓ ${description}: ${last}`);
        return;
      }
    } catch (error: any) {
      last = -1;
    }

    await new Promise((resolve) => setTimeout(resolve, 5000));
  }

  throw new Error(`${description}: reached ${last}, expected at least ${expected}, after ${timeoutMs}ms (${url})`);
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

    await waitForApi('Tokens listed by the API', `${config.apiServiceUrl}/tokens/count`, 5);
    await waitForApi('Tokens listed on the issuer account', `${config.apiServiceUrl}/accounts/${config.aliceAddress}/tokens/count`, 5);
    // 2 NFT + 2 SFT collections, five items each; the meta-esdt ones come on top of that
    await waitForApi('Collections listed by the API', `${config.apiServiceUrl}/collections/count`, 4);
    await waitForApi('NFTs listed by the API', `${config.apiServiceUrl}/nfts/count`, 20);

    console.log('Test data preparation completed successfully!');
  } catch (error) {
    console.error('Error preparing test data:', error);
    process.exit(1);
  }
}

void prepareTestData();
