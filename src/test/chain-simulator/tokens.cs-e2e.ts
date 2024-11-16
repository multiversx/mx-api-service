import axios from 'axios';

const CHAIN_SIMULATOR_URL = 'http://localhost:8085';
const API_SERVICE_URL = 'http://localhost:3001';
const ALICE_ADDRESS =
  'erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th';
const BOB_ADDRESS =
  'erd1spyavw0956vq68xj8y4tenjpq2wd5a9p2c6j8gsz7ztyrnpxrruqzu66jx';
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

    it('should return filtered tokens by type', async () => {
      const tokenType = 'FungibleESDT';
      const response = await axios.get(
        `${API_SERVICE_URL}/tokens?type=${tokenType}`,
      );
      const tokens = response.data;

      expect(response.status).toBe(200);
      for (const token of tokens) {
        expect(token.type).toBe(tokenType);
      }
    });

    it('should return filtered tokens by multiple identifiers', async () => {
      const fetchTokens = await axios.get(`${API_SERVICE_URL}/tokens`);
      const identifiers = fetchTokens.data.map(
        (token: any) => token.identifier,
      );
      const response = await axios.get(
        `${API_SERVICE_URL}/tokens?identifiers=${identifiers.join(',')}`,
      );
      const tokens = response.data;

      expect(response.status).toBe(200);
      for (const token of tokens) {
        expect(identifiers).toContain(token.identifier);
      }
    });

    it('should return filtered tokens by search term', async () => {
      const searchTerm = 'Token1';
      const response = await axios.get(
        `${API_SERVICE_URL}/tokens?search=${searchTerm}`,
      );
      const tokens = response.data;

      expect(response.status).toBe(200);
      for (const token of tokens) {
        expect(token.name).toContain(searchTerm);
      }
    });
  });

  describe('GET /tokens/count', () => {
    it('should return status code 200 and the total count of tokens', async () => {
      const response = await axios.get(`${API_SERVICE_URL}/tokens/count`);
      const count = response.data;

      expect(response.status).toBe(200);
      expect(count).toBeGreaterThanOrEqual(0);
      expect(typeof count).toBe('number');
    });

    it('should return filtered token count by name', async () => {
      const tokenName = 'Token1';
      const response = await axios.get(
        `${API_SERVICE_URL}/tokens/count?name=${tokenName}`,
      );
      const count = response.data;

      expect(response.status).toBe(200);
      expect(typeof count).toBe('number');
    });

    it('should return filtered token count by search term', async () => {
      const searchTerm = 'Token';
      const response = await axios.get(
        `${API_SERVICE_URL}/tokens/count?search=${searchTerm}`,
      );
      const count = response.data;

      expect(response.status).toBe(200);
      expect(typeof count).toBe('number');
    });
  });

  describe('GET /tokens/:identifier', () => {
    it('should return status code 200 and token details', async () => {
      const tokensResponse = await axios.get(
        `${API_SERVICE_URL}/tokens?size=1`,
      );
      const response = await axios.get(
        `${API_SERVICE_URL}/tokens/${tokensResponse.data[0].identifier}`,
      );
      const token = response.data;

      expect(response.status).toBe(200);
      expect(token).toHaveProperty(
        'identifier',
        tokensResponse.data[0].identifier,
      );
    });

    it('should return status code 400 for non-existent token', async () => {
      const nonExistentTokenIdentifier = 'NON_EXISTENT_TOKEN';
      try {
        await axios.get(
          `${API_SERVICE_URL}/tokens/${nonExistentTokenIdentifier}`,
        );
      } catch (error: any) {
        expect(error.response.status).toBe(400);
      }
    });

    it('should return token details with denominated supply (number)', async () => {
      const tokensResponse = await axios.get(
        `${API_SERVICE_URL}/tokens?size=1`,
      );
      const response = await axios.get(
        `${API_SERVICE_URL}/tokens/${tokensResponse.data[0].identifier}?denominated=true`,
      );
      const token = response.data;

      expect(response.status).toBe(200);
      expect(token).toHaveProperty(
        'identifier',
        tokensResponse.data[0].identifier,
      );
      expect(token).toHaveProperty('supply');
      expect(typeof token.supply).toStrictEqual('number');
    });

    it('should return token details with supply (string)', async () => {
      const tokensResponse = await axios.get(
        `${API_SERVICE_URL}/tokens?size=1`,
      );
      const response = await axios.get(
        `${API_SERVICE_URL}/tokens/${tokensResponse.data[0].identifier}?denominated=false`,
      );
      const token = response.data;

      expect(response.status).toBe(200);
      expect(token).toHaveProperty(
        'identifier',
        tokensResponse.data[0].identifier,
      );
      expect(token).toHaveProperty('supply');
      expect(typeof token.supply).toStrictEqual('string');
    });
  });

  describe('GET /tokens/:identifier/roles', () => {
    it('should return status code 200 and token roles', async () => {
      const tokensResponse = await axios.get(
        `${API_SERVICE_URL}/tokens?size=1`,
      );
      const response = await axios.get(
        `${API_SERVICE_URL}/tokens/${tokensResponse.data[0].identifier}/roles`,
      );
      const roles = response.data;

      expect(response.status).toBe(200);
      expect(roles).toBeInstanceOf(Array);
      for (const role of roles) {
        expect(role).toHaveProperty('canLocalMint');
        expect(role).toHaveProperty('canLocalBurn');
        expect(role).toHaveProperty('roles');
        expect(role.roles).toBeInstanceOf(Array);
      }
    });

    it('should return status code 400 for invalid token identifier', async () => {
      const nonExistentTokenIdentifier = 'NON_EXISTENT_TOKEN';
      try {
        await axios.get(
          `${API_SERVICE_URL}/tokens/${nonExistentTokenIdentifier}/roles`,
        );
      } catch (error: any) {
        expect(error.response.status).toBe(400);
      }
    });

    it('should return status code 404 for non-existent token roles', async () => {
      const nonExistentTokenIdentifier = 'TKNTEST1-f61adc';
      try {
        await axios.get(
          `${API_SERVICE_URL}/tokens/${nonExistentTokenIdentifier}/roles`,
        );
      } catch (error: any) {
        expect(error.response.status).toBe(404);
      }
    });
  });

  describe('GET /tokens/:identifier/roles/:address', () => {
    it('should return status code 200 and token roles for the address', async () => {
      const tokensResponse = await axios.get(
        `${API_SERVICE_URL}/tokens?size=1`,
      );
      const response = await axios.get(
        `${API_SERVICE_URL}/tokens/${tokensResponse.data[0].identifier}/roles/${ALICE_ADDRESS}`,
      );
      const roles = response.data;
      expect(response.status).toBe(200);
      expect(roles).toHaveProperty('canLocalMint');
      expect(roles).toHaveProperty('canLocalBurn');
    });

    it('should return status code 400 for non-existent token roles for the address', async () => {
      const nonExistentTokenIdentifier = 'NON_EXISTENT_TOKEN';
      try {
        await axios.get(
          `${API_SERVICE_URL}/tokens/${nonExistentTokenIdentifier}/roles/${ALICE_ADDRESS}`,
        );
      } catch (error: any) {
        expect(error.response.status).toBe(400);
      }
    });

    it('should return status code 404 for non-existent address roles for the token', async () => {
      const tokensResponse = await axios.get(
        `${API_SERVICE_URL}/tokens?size=1`,
      );

      try {
        await axios.get(
          `${API_SERVICE_URL}/tokens/${tokensResponse.data[0].identifier}/roles/${BOB_ADDRESS}`,
        );
      } catch (error: any) {
        expect(error.response.status).toBe(404);
      }
    });
  });
});
