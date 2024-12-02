import axios from 'axios';
import { config } from './config/env.config';
import { ChainSimulatorUtils } from './utils/test.utils';
import { fundAddress, issueMultipleNftsCollections } from './utils/chain.simulator.operations';

describe('Collections e2e tests with chain simulator', () => {
  beforeAll(async () => {
    await ChainSimulatorUtils.waitForEpoch(2);

    await fundAddress(config.chainSimulatorUrl, config.aliceAddress);
    await issueMultipleNftsCollections(config.chainSimulatorUrl, config.aliceAddress, 2);
    await new Promise((resolve) => setTimeout(resolve, 5000));
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /collections', () => {
    it('should return status code 200', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/collections`);
      expect(response.status).toBe(200);
    });

    it('should support pagination', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/collections?size=2`);
      expect(response.status).toBe(200);
      expect(response.data.length).toBe(2);
    });

    it('should filter by search term', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/collections?search=NFTCollection1`);
      expect(response.status).toBe(200);
      expect(response.data.some((collection: any) => collection.name.includes('NFTCollection1'))).toBe(true);
    });

    it('should filter by identifiers', async () => {
      const collectionsIdentifiers = await axios.get(`${config.apiServiceUrl}/collections?size=2`);
      const collection = collectionsIdentifiers.data.map((collection: any) => collection.collection);
      const response = await axios.get(`${config.apiServiceUrl}/collections?identifiers=${[collection[0], collection[1]]}`);

      expect(response.status).toBe(200);
      expect(response.data.length).toBe(2);
    });

    it('should filter by type', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/collections?type=NonFungibleESDT`);
      expect(response.status).toBe(200);
      expect(response.data.every((collection: any) => collection.type === 'NonFungibleESDT')).toBe(true);
    });

    it('should filter by creator address', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/collections?creator=${config.aliceAddress}`);
      expect(response.status).toBe(200);
      expect(response.data.every((collection: any) => collection.creator === config.aliceAddress)).toBe(true);
    });

    it('should exclude MetaESDT collections when specified', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/collections?excludeMetaESDT=true`);
      expect(response.status).toBe(200);
      expect(response.data.every((collection: any) => collection.type !== 'MetaESDT')).toBe(true);
    });

    it('should sort collections', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/collections?sort=timestamp&order=desc`);
      expect(response.status).toBe(200);

      const timestamps = response.data.map((collection: any) => collection.timestamp);
      const sortedTimestamps = [...timestamps].sort((a, b) => b - a);
      expect(timestamps).toEqual(sortedTimestamps);
    });
  });
});
