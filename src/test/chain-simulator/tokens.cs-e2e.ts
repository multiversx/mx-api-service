import axios from 'axios';

const CHAIN_SIMULATOR_URL = 'http://localhost:8085';
const API_SERVICE_URL = 'http://localhost:3001';
const ALICE_ADDRESS =
  'erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th';

import { fundAddress, issueMultipleEsdts } from './chain.simulator.operations';

describe('Tokens e2e tests with chain simulator', () => {
  beforeAll(async () => {
    try {
      const response = await axios.get(
        `${CHAIN_SIMULATOR_URL}/simulator/observers`,
      );
      let numRetries = 0;
      while (true) {
        if (response.status === 200) {
          await axios.post(
            `${CHAIN_SIMULATOR_URL}/simulator/generate-blocks-until-epoch-reached/2`,
            {},
          );
          break;
        }

        numRetries += 1;
        if (numRetries > 50) {
          fail('Chain simulator not started!');
        }
      }

      // Fund Alice's address
      await fundAddress(CHAIN_SIMULATOR_URL, ALICE_ADDRESS);

      // Issue multiple ESDT tokens
      await issueMultipleEsdts(CHAIN_SIMULATOR_URL, ALICE_ADDRESS, 5);
      await new Promise((resolve) => setTimeout(resolve, 10000));
    } catch (e) {
      console.error(e);
    }
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /tokens', () => {
    it('should return status code 200 and a list of tokens', async () => {
      const response = await axios.get(`${API_SERVICE_URL}/tokens`);
      const tokens = response.data;
      console.log(tokens);

      expect(response.status).toBe(200);
      expect(tokens).toBeInstanceOf(Array);
    });

    it('should return filtered tokens by name', async () => {
      const tokenName = 'Token1';
      const response = await axios.get(
        `${API_SERVICE_URL}/tokens?name=${tokenName}`,
      );
      const tokens = response.data;
      expect(response.status).toBe(200);
      for (const token of tokens) {
        expect(token.name).toBe(tokenName);
      }
    });

    it('should return filtered tokens by identifier', async () => {
      const fetchTokens = await axios.get(`${API_SERVICE_URL}/tokens`);
      const tokenIdentifier = fetchTokens.data[0].identifier;
      const response = await axios.get(
        `${API_SERVICE_URL}/tokens?identifier=${tokenIdentifier}`,
      );
      const tokens = response.data;
      expect(response.status).toBe(200);
      for (const token of tokens) {
        expect(token.identifier).toBe(tokenIdentifier);
      }
    });

    it('should support pagination and return 2 tokens', async () => {
      const response = await axios.get(`${API_SERVICE_URL}/tokens?size=2`);
      const tokens = response.data;
      expect(response.status).toBe(200);
      expect(tokens.length).toBe(2);
      expect(Array.isArray(tokens)).toBe(true);
    });
  });
});
