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

  describe('GET /accounts/:address/tokens/count', () => {
    it('should return the total number of tokens for a given address', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/tokens/count`);
      expect(response.status).toBe(200);
      expect(response.data).toBeGreaterThan(0);
    });

    it('should filter tokens by type', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/tokens/count?type=FungibleESDT`);
      expect(response.status).toBe(200);
      expect(response.data).toBeGreaterThanOrEqual(0);
      expect(typeof response.data).toBe('number');
    });

    it('should return 0 for an address with 0 tokens', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/accounts/${config.bobAddress}/tokens/count`);
      expect(response.status).toBe(200);
      expect(response.data).toBe(0);
      expect(typeof response.data).toBe('number');
    });

    it('should filter tokens by name', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/tokens/count?name=Token`);
      expect(response.status).toBe(200);
      expect(response.data).toBeGreaterThanOrEqual(0);
    });

    it('should filter tokens by identifier', async () => {
      const tokens = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/tokens`);
      const identifier = tokens.data[0].identifier;
      const response = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/tokens/count?identifier=${identifier}`);
      expect(response.status).toBe(200);
      expect(response.data).toStrictEqual(1);
    });

    it('should filter tokens by identifiers', async () => {
      const tokens = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/tokens`);
      const identifiers = tokens.data.map((token: any) => token.identifier);
      const response = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/tokens/count?identifiers=${identifiers.join(',')}`);
      expect(response.status).toBe(200);
      expect(response.data).toStrictEqual(identifiers.length);
    });
  });

  describe('GET /accounts/:address/tokens/:token', () => {
    it('should return token details for a given address and token', async () => {
      const tokens = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/tokens`);
      const identifier = tokens.data[0].identifier;
      const response = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/tokens/${identifier}`);

      expect(response.status).toBe(200);
      expect(response.data.identifier).toStrictEqual(identifier);
    });
  });

  describe('GET /accounts/:address/roles/collections', () => {
    it('should return collections with roles for a given address', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/roles/collections`);
      expect(response.status).toBe(200);
    });

    it('should return paginated results with from and size parameters', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/roles/collections?from=0&size=2`);
      expect(response.status).toBe(200);
      expect(response.data.length).toBeLessThanOrEqual(2);
    });

    it('should return results by owner parameter', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/roles/collections?owner=${config.aliceAddress}`);
      expect(response.status).toBe(200);
    });

    it('should return results by canCreate parameter', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/roles/collections?canCreate=false`);
      expect(response.status).toBe(200);

      for (const collection of response.data) {
        expect(collection.canCreate).toBe(false);
      }
    });

    it('should return results by canBurn parameter', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/roles/collections?canBurn=false`);
      expect(response.status).toBe(200);

      for (const collection of response.data) {
        expect(collection.canBurn).toBe(false);
      }
    });

    it('should return results by canAddQuantity parameter', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/roles/collections?canAddQuantity=false`);
      expect(response.status).toBe(200);
    });

    it('should return results by canUpdateAttributes parameter', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/roles/collections?canUpdateAttributes=false`);
      expect(response.status).toBe(200);

      for (const collection of response.data) {
        expect(collection.canUpdateAttributes).toBe(false);
      }
    });

    it('should return results by canAddUri parameter', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/roles/collections?canAddUri=false`);
      expect(response.status).toBe(200);

      for (const collection of response.data) {
        expect(collection.canAddUri).toBe(false);
      }
    });

    it('should return results by canTransferRole parameter', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/roles/collections?canTransferRole=false`);
      expect(response.status).toBe(200);
    });

    it('should return collection with all expected fields', async () => {
      const expectedProperties = [
        'collection',
        'type',
        'subType',
        'name',
        'ticker',
        'owner',
        'timestamp',
        'canFreeze',
        'canWipe',
        'canPause',
        'canTransferNftCreateRole',
        'canChangeOwner',
        'canUpgrade',
        'canAddSpecialRoles',
        'canTransfer',
        'canCreate',
        'canBurn',
        'canUpdateAttributes',
        'canAddUri',
      ];

      const expectedRoleProperties = [
        'canCreate',
        'canBurn',
        'canAddQuantity',
        'canUpdateAttributes',
        'canAddUri',
      ];

      const response = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/roles/collections`);
      expect(response.status).toBe(200);

      const collection = response.data[0];

      for (const property of expectedProperties) {
        expect(collection).toHaveProperty(property);
      }

      expect(collection).toHaveProperty('role');
      for (const property of expectedRoleProperties) {
        expect(collection.role).toHaveProperty(property);
      }
    });
  });

  describe('GET /accounts/:address/roles/collections/count', () => {
    it('should return the total number of collections with roles for a given address', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/roles/collections/count`);
      expect(response.status).toBe(200);
      expect(response.data).toBeGreaterThan(0);
    });

    it('should return results by type parameter', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/roles/collections/count?type=NonFungibleESDT`);
      expect(response.status).toBe(200);
      expect(response.data).toBeGreaterThanOrEqual(1);
    });

    it('should return results by owner parameter', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/roles/collections/count?owner=${config.aliceAddress}`);
      expect(response.status).toBe(200);
      expect(response.data).toBeGreaterThanOrEqual(1);
    });

    it('should return results by canCreate parameter', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/roles/collections/count?canCreate=false`);
      expect(response.status).toBe(200);
      expect(response.data).toBeGreaterThanOrEqual(1);
    });

    it('should return results by canBurn parameter', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/roles/collections/count?canBurn=false`);
      expect(response.status).toBe(200);
      expect(response.data).toBeGreaterThanOrEqual(1);
    });

    it('should return results by canAddQuantity parameter', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/roles/collections/count?canAddQuantity=false`);
      expect(response.status).toBe(200);
      expect(response.data).toBeGreaterThanOrEqual(1);
    });

    it('should return results by excludeMetaESDT parameter', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/roles/collections/count?excludeMetaESDT=true`);
      expect(response.status).toBe(200);
      expect(response.data).toBeGreaterThanOrEqual(1);
    });
  });

  describe('GET /accounts/:address/roles/collections/:collection', () => {
    it('should return collection details with roles for a given address and collection', async () => {
      const collections = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/roles/collections`);
      const collection = collections.data[0].collection;
      const response = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/roles/collections/${collection}`);

      expect(response.status).toBe(200);
      expect(response.data.collection).toBe(collection);

      const expectedProperties = [
        'collection',
        'type',
        'subType',
        'name',
        'ticker',
        'owner',
        'timestamp',
        'canFreeze',
        'canWipe',
        'canPause',
        'canTransferNftCreateRole',
        'canChangeOwner',
        'canUpgrade',
        'canAddSpecialRoles',
        'canTransfer',
        'canCreate',
        'canBurn',
        'canUpdateAttributes',
        'canAddUri',
      ];

      for (const property of expectedProperties) {
        expect(response.data).toHaveProperty(property);
      }
    });

    it('should return 404 for non-existent collection', async () => {
      try {
        await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/roles/collections/NFT2-b1cf6d`);
      } catch (error: any) {
        expect(error.response.status).toBe(404);
      }
    });
  });

  describe('GET /accounts/:address/roles/tokens', () => {
    it('should return tokens with roles for a given address', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/roles/tokens`);
      expect(response.status).toBe(200);
      expect(response.data.length).toBeGreaterThan(0);

      const expectedProperties = [
        'type',
        'subType',
        'identifier',
        'name',
        'ticker',
        'owner',
        'decimals',
        'isPaused',
        'transactions',
        'transactionsLastUpdatedAt',
        'transfers',
        'transfersLastUpdatedAt',
        'accounts',
        'accountsLastUpdatedAt',
        'canUpgrade',
        'canMint',
        'canChangeOwner',
        'canAddSpecialRoles',
        'canPause',
        'canFreeze',
        'canWipe',
        'timestamp',
        'mexPairType',
        'ownersHistory',
        'role',
        'canLocalMint',
        'canLocalBurn',
        'canTransfer',
      ];

      for (const property of expectedProperties) {
        expect(response.data[0]).toHaveProperty(property);
      }
    });

    it('should return paginated results with from and size parameters', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/roles/tokens?from=0&size=2`);
      expect(response.status).toBe(200);
      expect(response.data.length).toBeLessThanOrEqual(2);
    });

    it('should return results by owner parameter', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/roles/tokens?owner=${config.aliceAddress}`);
      expect(response.status).toBe(200);
      expect(response.data.length).toBeGreaterThanOrEqual(1);
    });

    it('should return results by canMint parameter', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/roles/tokens?canMint=false`);
      expect(response.status).toBe(200);
      expect(response.data.length).toBeGreaterThanOrEqual(1);
    });

    it('should return results by canBurn parameter', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/roles/tokens?canBurn=false`);
      expect(response.status).toBe(200);
      expect(response.data.length).toBeGreaterThanOrEqual(1);
    });

    it('should return results based on search parameter', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/roles/tokens?search=Token1`);
      expect(response.status).toBe(200);
      expect(response.data.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('GET /accounts/:address/roles/tokens/count', () => {
    it('should return the total number of tokens with roles for a given address', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/roles/tokens/count`);
      expect(response.status).toBe(200);
      expect(response.data).toBeGreaterThan(1);
    });

    it('should return results by owner parameter', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/roles/tokens/count?owner=${config.aliceAddress}`);
      expect(response.status).toBe(200);
      expect(response.data).toBeGreaterThanOrEqual(1);
    });

    it('should return results by canMint parameter', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/roles/tokens/count?canMint=false`);
      expect(response.status).toBe(200);
      expect(response.data).toBeGreaterThanOrEqual(1);
    });

    it('should return results by canBurn parameter', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/roles/tokens/count?canBurn=false`);
      expect(response.status).toBe(200);
      expect(response.data).toBeGreaterThanOrEqual(1);
    });

    it('should return results by search parameter', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/roles/tokens/count?search=Token1`);
      expect(response.status).toBe(200);
      expect(response.data).toBeGreaterThanOrEqual(1);
    });
  });

  describe('GET /accounts/:address/roles/tokens/:identifier', () => {
    it('should return token details with roles for a given address and identifier', async () => {
      const tokens = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/roles/tokens`);
      const identifier = tokens.data[0].identifier;
      const response = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/roles/tokens/${identifier}`);

      expect(response.status).toBe(200);

      const expectedProperties = [
        'type',
        'subType',
        'identifier',
        'name',
        'ticker',
        'owner',
        'decimals',
        'isPaused',
        'transactions',
        'transactionsLastUpdatedAt',
        'transfers',
        'transfersLastUpdatedAt',
        'accounts',
        'accountsLastUpdatedAt',
        'canUpgrade',
        'canMint',
        'canChangeOwner',
        'canAddSpecialRoles',
        'canPause',
        'canFreeze',
        'canWipe',
        'timestamp',
        'mexPairType',
        'ownersHistory',
        'role',
        'canLocalMint',
        'canLocalBurn',
        'canTransfer',
      ];

      for (const property of expectedProperties) {
        expect(response.data).toHaveProperty(property);
      }
    });
  });
});

