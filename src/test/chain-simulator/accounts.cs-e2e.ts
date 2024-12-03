import axios from "axios";
import { config } from "./config/env.config";
import { ChainSimulatorUtils } from "./utils/test.utils";

describe('Accounts e2e tests with chain simulator', () => {
  beforeAll(async () => {
    await ChainSimulatorUtils.waitForEpoch(2);
  });

  describe('GET /accounts with query parameters', () => {
    it('should return paginated results with from and size parameters', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/accounts?from=0&size=5`);
      expect(response.status).toBe(200);
      expect(response.data.length).toBe(5);
    });

    it('should filter accounts by owner address', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/accounts?ownerAddress=${config.aliceAddress}`);
      expect(response.status).toBe(200);

      for (const account of response.data) {
        expect(account.ownerAddress).toBe(config.aliceAddress);
      }
    });

    it('should filter smart contract accounts', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/accounts?isSmartContract=true`);
      expect(response.status).toBe(200);

      for (const account of response.data) {
        expect(account.shard).toBe(4294967295);
      }
    });

    it('should search accounts by address', async () => {
      const searchTerm = config.aliceAddress.substring(0, 10);
      const response = await axios.get(`${config.apiServiceUrl}/accounts?search=${searchTerm}`);
      expect(response.status).toBe(200);

      for (const account of response.data) {
        expect(account.address.toLowerCase()).toContain(searchTerm.toLowerCase());
      }
    });

    // TODO: to be implemented in Chain Simulator
    it.skip('should return accounts with transaction count when requested', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/accounts?withTxCount=true`);
      expect(response.status).toBe(200);
      for (const account of response.data) {
        expect(account).toHaveProperty('txCount');
      }
    });

    it('should validate account structure', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/accounts`);
      expect(response.status).toBe(200);

      response.data.forEach((account: any) => {
        expect(account).toHaveProperty('address');
        expect(account).toHaveProperty('balance');
        expect(account).toHaveProperty('nonce');
        expect(account).toHaveProperty('timestamp');
        expect(account).toHaveProperty('shard');
      });
    });
  });

  describe('GET /accounts/count', () => {
    it('should return the total number of accounts', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/accounts/count`);
      expect(response.status).toBe(200);
      expect(response.data).toBeGreaterThan(0);
    });

    it('should filter accounts by owner address', async () => {
      const ownerAddress = 'erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqzllls8a5w6u';
      const response = await axios.get(`${config.apiServiceUrl}/accounts/count?ownerAddress=${ownerAddress}`);
      expect(response.status).toBe(200);
      expect(response.data).toBe(1);
    });

    it('should filter smart contract accounts', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/accounts/count?isSmartContract=true`);
      expect(response.status).toBe(200);
      expect(response.data).toBeGreaterThanOrEqual(1);
    });
  });

  describe('GET /accounts/c alternative', () => {
    it('should return the total number of accounts', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/accounts/c`);
      expect(response.status).toBe(200);
      expect(response.data).toBeGreaterThan(0);
    });

    it('should filter accounts by owner address', async () => {
      const ownerAddress = 'erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqzllls8a5w6u';
      const response = await axios.get(`${config.apiServiceUrl}/accounts/c?ownerAddress=${ownerAddress}`);
      expect(response.status).toBe(200);
      expect(response.data).toBe(1);
    });

    it('should filter smart contract accounts', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/accounts/c?isSmartContract=true`);
      expect(response.status).toBe(200);
      expect(response.data).toBeGreaterThanOrEqual(1);
    });
  });

  describe('GET /accounts/:address', () => {
    it('should return account details for a given address', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}`);
      expect(response.status).toBe(200);
    });

    it('should return account details for a given address with guardian info', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}?withGuardianInfo=true`);
      expect(response.status).toBe(200);
      expect(response.data.isGuarded).toBe(false);
    });

    it('should return correct account details with all fields', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}`);
      expect(response.status).toBe(200);

      expect(response.data.balance).toBeDefined();
      expect(response.data.shard).toBeDefined();
      expect(response.data.nonce).toBeDefined();
      expect(response.data.txCount).toBeDefined();
      expect(response.data.scrCount).toBeDefined();

      expect(typeof response.data.balance).toBe('string');
      expect(typeof response.data.shard).toBe('number');
      expect(typeof response.data.nonce).toBe('number');
      expect(typeof response.data.txCount).toBe('number');
      expect(typeof response.data.scrCount).toBe('number');
    });

    it('should return 400 for non-existent / invalid address', async () => {
      const invalidAddress = 'erd1invalid000000000000000000000000000000000000000000000000000';
      try {
        await axios.get(`${config.apiServiceUrl}/accounts/${invalidAddress}`);
      } catch (error: any) {
        expect(error.response.status).toBe(400);
      }
    });

    it('should return address field in response when fields query parameter is provided', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}?fields=address`);
      expect(response.status).toBe(200);
      expect(response.data.address).toBeDefined();
    });
  });

  describe('GET /accounts/:address/tokens', () => {
    it('should return tokens for a given address', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/tokens`);
      expect(response.status).toBe(200);
      expect(Array.isArray(response.data)).toBe(true);
    });

    it('should return paginated results with from and size parameters', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/tokens?from=0&size=2`);
      expect(response.status).toBe(200);
      expect(response.data.length).toBeLessThanOrEqual(2);
    });

    it('should return tokens with correct structure', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/tokens`);
      expect(response.status).toBe(200);

      for (const token of response.data) {
        expect(token).toHaveProperty('type');
        expect(token).toHaveProperty('identifier');
        expect(token).toHaveProperty('name');
        expect(token).toHaveProperty('ticker');
        expect(token).toHaveProperty('decimals');
        expect(token).toHaveProperty('balance');
        expect(typeof token.balance).toBe('string');
      }
    });

    it('should filter tokens by type', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/tokens?type=FungibleESDT`);
      expect(response.status).toBe(200);

      for (const token of response.data) {
        expect(token.type).toBe('FungibleESDT');
      }
    });

    it('should search tokens by name', async () => {
      const searchTerm = 'Token';
      const response = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/tokens?name=${searchTerm}`);
      expect(response.status).toBe(200);

      for (const token of response.data) {
        expect(token.name.toLowerCase()).toContain(searchTerm.toLowerCase());
      }
    });

    it('should filter tokens by identifier', async () => {
      const accountToken = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/tokens`);
      const identifier = accountToken.data[0].identifier;
      const response = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/tokens?identifier=${identifier}`);
      expect(response.status).toBe(200);

      for (const token of response.data) {
        expect(token.identifier).toBe(identifier);
      }
    });

    it('should return empty array for non-existent address', async () => {
      const invalidAddress = 'erd1invalid000000000000000000000000000000000000000000000000000';
      try {
        const response = await axios.get(`${config.apiServiceUrl}/accounts/${invalidAddress}/tokens`);
        expect(response.status).toBe(200);
        expect(response.data).toEqual([]);
      } catch (error: any) {
        expect(error.response.status).toBe(400);
      }
    });
  });
});

