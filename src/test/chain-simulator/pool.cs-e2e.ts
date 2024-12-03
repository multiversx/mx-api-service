import axios from 'axios';
import { config } from './config/env.config';
import { ChainSimulatorUtils } from './utils/test.utils';
import { fundAddress, sendTransaction } from './utils/chain.simulator.operations';

describe('Pool e2e tests with chain simulator', () => {
  beforeAll(async () => {
    await ChainSimulatorUtils.waitForEpoch(2);
    await fundAddress(config.chainSimulatorUrl, config.aliceAddress);
    await sendTransaction({nonceOffset: 20, value: '0', sender: config.aliceAddress, receiver: config.bobAddress, chainSimulatorUrl: config.chainSimulatorUrl, dataField: "pool1"});
    await sendTransaction({nonceOffset: 21, value: '0', sender: config.aliceAddress, receiver: config.bobAddress, chainSimulatorUrl: config.chainSimulatorUrl, dataField: "pool2"});
    await new Promise((resolve) => setTimeout(resolve, 20000));
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /pool', () => {
    it('should return status code 200', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/pool`);
      const txsPool = response.data;

      expect(response.status).toBe(200);
      expect(txsPool).toBeInstanceOf(Array);
    });

    it('should return the transaction pool', async () => {
      const response = await axios.get(
        `${config.apiServiceUrl}/pool`,
      );
      const pool = response.data;
      let numTimesAliceWasSender = 0;
      let numTimesBobWasReceiver = 0;
      for (const tx of pool) {
        numTimesAliceWasSender += tx.sender === config.aliceAddress ? 1 : 0;
        numTimesBobWasReceiver += tx.receiver === config.bobAddress ? 1 : 0;
        expect(tx).toHaveProperty('receiver');
        expect(tx).toHaveProperty('txHash');
        expect(tx).toHaveProperty('nonce');
        expect(tx).toHaveProperty('gasPrice');
        expect(tx).toHaveProperty('gasLimit');
      }

      expect(numTimesAliceWasSender).toBeGreaterThanOrEqual(2);
      expect(numTimesBobWasReceiver).toBeGreaterThanOrEqual(2);
    });
  });


  describe('GET /pool/:txhash', () => {
    it('should return status code 200 and the transaction', async () => {
      const poolResponse = await axios.get(
        `${config.apiServiceUrl}/pool?size=1`,
      );
      const response = await axios.get(
        `${config.apiServiceUrl}/pool/${poolResponse.data[0].txHash}`,
      );
      const tx = response.data;

      expect(response.status).toBe(200);
      expect(tx).toHaveProperty(
        'txHash',
        poolResponse.data[0].txHash,
      );
    });

    it('should return status code 404 for non-existent tx hash', async () => {
      const nonExistentTxHash = '0000000000000000000000000000000000000000000000000000000000000000';
      try {
        await axios.get(
          `${config.apiServiceUrl}/pool/${nonExistentTxHash}`,
        );
      } catch (error: any) {
        expect(error.response.status).toBe(404);
      }
    });
  });
});
