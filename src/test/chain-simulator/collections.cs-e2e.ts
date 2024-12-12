import axios from 'axios';
import { config } from './config/env.config';
import { NftType } from 'src/common/indexer/entities/nft.type';

describe('Collections e2e tests with chain simulator', () => {
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

  describe('GET /collections/count', () => {
    it('should return status code 200', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/collections/count`);

      expect(response.status).toBe(200);
    });

    it('should return total count of collections', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/collections/count`);

      expect(response.status).toBe(200);
      expect(response.data).toBeGreaterThanOrEqual(0);
      expect(typeof response.data).toBe('number');
    });

    it('should return filtered collection count by search term', async () => {
      const searchTerm = 'NFTCollection1';
      const response = await axios.get(`${config.apiServiceUrl}/collections/count?search=${searchTerm}`);

      expect(response.status).toBe(200);
      expect(response.data).toBeGreaterThanOrEqual(0);
      expect(typeof response.data).toBe('number');
    });

    it('should return filtered collection count by type', async () => {
      const type = NftType.NonFungibleESDT;
      const response = await axios.get(`${config.apiServiceUrl}/collections/count?type=${type}`);

      expect(response.status).toBe(200);
      expect(response.data).toBeGreaterThanOrEqual(0);
      expect(typeof response.data).toBe('number');
    });
  });

  describe('GET /collections/c (alternative endpoint)', () => {
    it('should return status code 200', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/collections/c`);

      expect(response.status).toBe(200);
    });

    it('should return total count of collections', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/collections/c`);

      expect(response.status).toBe(200);
      expect(response.data).toBeGreaterThanOrEqual(0);
      expect(typeof response.data).toBe('number');
    });

    it('should return filtered collection count by search term', async () => {
      const searchTerm = 'NFTCollection1';
      const response = await axios.get(`${config.apiServiceUrl}/collections/c?search=${searchTerm}`);

      expect(response.status).toBe(200);
      expect(response.data).toBeGreaterThanOrEqual(0);
      expect(typeof response.data).toBe('number');
    });

    it('should return filtered collection count by type', async () => {
      const type = NftType.NonFungibleESDT;
      const response = await axios.get(`${config.apiServiceUrl}/collections/c?type=${type}`);

      expect(response.status).toBe(200);
      expect(response.data).toBeGreaterThanOrEqual(0);
      expect(typeof response.data).toBe('number');
    });
  });

  describe('GET /collections/:collection', () => {
    it('should return status code 200', async () => {
      const collectionsIdentifiers = await axios.get(`${config.apiServiceUrl}/collections?size=1`);
      const collection = collectionsIdentifiers.data.map((collection: any) => collection.collection);
      const response = await axios.get(`${config.apiServiceUrl}/collections/${collection[0]}`);

      expect(response.status).toBe(200);
      expect(response.data.collection).toBe(collection[0]);
    });
  });

  describe('GET /collections/:collections/nfts', () => {
    it('should return all nfts for a collection', async () => {
      const collectionsIdentifiers = await axios.get(`${config.apiServiceUrl}/collections?size=1&type=NonFungibleESDT`);
      const collection = collectionsIdentifiers.data.map((collection: any) => collection.collection);
      const response = await axios.get(`${config.apiServiceUrl}/collections/${collection[0]}/nfts`);

      expect(response.status).toBe(200);
      expect(response.data.length).toStrictEqual(5);
    });

    it('should support pagination', async () => {
      const collectionsIdentifiers = await axios.get(`${config.apiServiceUrl}/collections?size=1&type=NonFungibleESDT`);
      const collection = collectionsIdentifiers.data.map((collection: any) => collection.collection);
      const response = await axios.get(`${config.apiServiceUrl}/collections/${collection[0]}/nfts?from=0&size=1`);

      expect(response.status).toBe(200);
      expect(response.data.length).toStrictEqual(1);
    });

    it('should return different NFTs with same pagination size', async () => {
      const collectionsIdentifiers = await axios.get(`${config.apiServiceUrl}/collections?size=1&type=NonFungibleESDT`);
      const collection = collectionsIdentifiers.data.map((collection: any) => collection.collection);

      const firstSet = await axios.get(`${config.apiServiceUrl}/collections/${collection[0]}/nfts?from=0&size=1`);
      const secondSet = await axios.get(`${config.apiServiceUrl}/collections/${collection[0]}/nfts?from=1&size=1`);

      expect(firstSet.status).toBe(200);
      expect(secondSet.status).toBe(200);

      expect(firstSet.data.length).toStrictEqual(1);
      expect(secondSet.data.length).toStrictEqual(1);

      expect(firstSet.data[0].identifier).not.toEqual(secondSet.data[0].identifier);
    });

    it('should return nfts with search term', async () => {
      const collectionsIdentifiers = await axios.get(`${config.apiServiceUrl}/collections?size=1&type=NonFungibleESDT`);
      const collection = collectionsIdentifiers.data.map((collection: any) => collection.collection);

      const collectionNft = await axios.get(`${config.apiServiceUrl}/collections/${collection}/nfts`);
      const collectionNftName = collectionNft.data.map((nft: any) => nft.name);
      const response = await axios.get(`${config.apiServiceUrl}/collections/${collection[0]}/nfts?search=${collectionNftName[0]}`);

      expect(response.status).toBe(200);
      expect(response.data.length).toStrictEqual(1);
    });

    it('should return nfts by identifiers', async () => {
      const collectionsIdentifiers = await axios.get(`${config.apiServiceUrl}/collections?size=2&type=NonFungibleESDT`);
      const collection = collectionsIdentifiers.data.map((collection: any) => collection.collection);

      const collectionNft = await axios.get(`${config.apiServiceUrl}/collections/${collection[0]}/nfts`);
      const collectionNftIdentifiers = collectionNft.data.map((nft: any) => nft.identifier);

      const response = await axios.get(`${config.apiServiceUrl}/collections/${collection[0]}/nfts?identifiers=${[collectionNftIdentifiers[0], collectionNftIdentifiers[1]]}`);

      expect(response.status).toBe(200);
      expect(response.data.length).toStrictEqual(2);
    });

    it('should return nfts with name', async () => {
      const collectionsIdentifiers = await axios.get(`${config.apiServiceUrl}/collections?size=1&type=NonFungibleESDT`);
      const collection = collectionsIdentifiers.data.map((collection: any) => collection.collection);

      const collectionNft = await axios.get(`${config.apiServiceUrl}/collections/${collection}/nfts`);
      const collectionNftName = collectionNft.data.map((nft: any) => nft.name);
      const response = await axios.get(`${config.apiServiceUrl}/collections/${collection[0]}/nfts?search=${collectionNftName[0]}`);

      expect(response.status).toBe(200);
      expect(response.data.length).toStrictEqual(1);
    });

    it('should return nfts with tags', async () => {
      const collectionsIdentifiers = await axios.get(`${config.apiServiceUrl}/collections?size=1&type=NonFungibleESDT`);
      const collection = collectionsIdentifiers.data.map((collection: any) => collection.collection);

      const response = await axios.get(`${config.apiServiceUrl}/collections/${collection[0]}/nfts?tags=test`);

      expect(response.status).toBe(200);
      expect(response.data.length).toStrictEqual(5);
    });

    it('should return nfts with creator', async () => {
      const collectionsIdentifiers = await axios.get(`${config.apiServiceUrl}/collections?size=1&type=NonFungibleESDT`);
      const collection = collectionsIdentifiers.data.map((collection: any) => collection.collection);

      const response = await axios.get(`${config.apiServiceUrl}/collections/${collection[0]}/nfts?creator=${config.aliceAddress}`);

      expect(response.status).toBe(200);
      expect(response.data.length).toStrictEqual(5);
    });

    it('should return nfts with isWhitelistedStorage false', async () => {
      const collectionsIdentifiers = await axios.get(`${config.apiServiceUrl}/collections?size=1&type=NonFungibleESDT`);
      const collection = collectionsIdentifiers.data.map((collection: any) => collection.collection);

      const response = await axios.get(`${config.apiServiceUrl}/collections/${collection[0]}/nfts?isWhitelistedStorage=false`);

      expect(response.status).toBe(200);
      expect(response.data.length).toStrictEqual(5);
    });

    it('should return nfts that have uris', async () => {
      const collectionsIdentifiers = await axios.get(`${config.apiServiceUrl}/collections?size=1&type=NonFungibleESDT`);
      const collection = collectionsIdentifiers.data.map((collection: any) => collection.collection);

      const response = await axios.get(`${config.apiServiceUrl}/collections/${collection[0]}/nfts?hasUris=true`);

      expect(response.status).toBe(200);
      expect(response.data.length).toStrictEqual(5);

      expect(response.data.every((nft: any) =>
        nft.uris &&
        Array.isArray(nft.uris) &&
        nft.uris.includes('aHR0cHM6Ly9leGFtcGxlLmNvbS9uZnQucG5n') &&
        nft.uris.includes('aHR0cHM6Ly9leGFtcGxlLmNvbS9uZnQuanNvbg==')
      )).toBe(true);
    });

    it('should return nfts with nonceBefore', async () => {
      const collectionsIdentifiers = await axios.get(`${config.apiServiceUrl}/collections?size=1&type=NonFungibleESDT`);
      const collection = collectionsIdentifiers.data.map((collection: any) => collection.collection);

      const response = await axios.get(`${config.apiServiceUrl}/collections/${collection[0]}/nfts?nonceBefore=1`);

      expect(response.status).toBe(200);
      expect(response.data.length).toStrictEqual(1);
      expect(response.data[0].nonce).toBe(1);
    });

    it('should return nfts with nonceBefore', async () => {
      const collectionsIdentifiers = await axios.get(`${config.apiServiceUrl}/collections?size=1&type=NonFungibleESDT`);
      const collection = collectionsIdentifiers.data.map((collection: any) => collection.collection);

      const response = await axios.get(`${config.apiServiceUrl}/collections/${collection[0]}/nfts?nonceBefore=2`);

      expect(response.status).toBe(200);
      expect(response.data.length).toStrictEqual(2);
      expect(response.data[0].nonce).toBe(2);
      expect(response.data[1].nonce).toBe(1);
    });

    it('should return nfts with nonceAfter', async () => {
      const collectionsIdentifiers = await axios.get(`${config.apiServiceUrl}/collections?size=1&type=NonFungibleESDT`);
      const collection = collectionsIdentifiers.data.map((collection: any) => collection.collection);

      const response = await axios.get(`${config.apiServiceUrl}/collections/${collection[0]}/nfts?nonceAfter=2`);

      expect(response.status).toBe(200);
      expect(response.data.length).toStrictEqual(4);
      expect(response.data[0].nonce).toBe(5);
      expect(response.data[1].nonce).toBe(4);
      expect(response.data[2].nonce).toBe(3);
      expect(response.data[3].nonce).toBe(2);
    });

    it('should return nfts with withOwner', async () => {
      const collectionsIdentifiers = await axios.get(`${config.apiServiceUrl}/collections?size=1&type=NonFungibleESDT`);
      const collection = collectionsIdentifiers.data.map((collection: any) => collection.collection);

      const response = await axios.get(`${config.apiServiceUrl}/collections/${collection[0]}/nfts?withOwner=true`);

      expect(response.status).toBe(200);
      expect(response.data.length).toStrictEqual(5);
      expect(response.data.supply).toBeUndefined();

      expect(response.data.every((nft: any) => nft.owner === config.aliceAddress)).toBe(true);
      expect(response.data.every((nft: any) => nft.type === NftType.NonFungibleESDT)).toBe(true);
    });

    it('should return nfts with withSupply', async () => {
      const collectionsIdentifiers = await axios.get(`${config.apiServiceUrl}/collections?size=1&type=SemiFungibleESDT`);
      const collection = collectionsIdentifiers.data.map((collection: any) => collection.collection);

      const response = await axios.get(`${config.apiServiceUrl}/collections/${collection[0]}/nfts?withSupply=true`);

      expect(response.status).toBe(200);
      expect(response.data.length).toStrictEqual(5);
      expect(response.data.owner).toBeUndefined();

      expect(response.data.every((nft: any) => nft.supply === "10")).toBe(true);
      expect(response.data.every((nft: any) => nft.type === NftType.SemiFungibleESDT)).toBe(true);
    });
  });

  describe('GET /collections/:collection/nfts/count', () => {
    it('should return nfts count for a collection', async () => {
      const collectionsIdentifiers = await axios.get(`${config.apiServiceUrl}/collections?size=1&type=NonFungibleESDT`);
      const collection = collectionsIdentifiers.data.map((collection: any) => collection.collection);

      const response = await axios.get(`${config.apiServiceUrl}/collections/${collection[0]}/nfts/count`);

      expect(response.status).toBe(200);
      expect(response.data).toStrictEqual(5);
    });

    it('should return nfts count for a collection with search term', async () => {
      const collectionsIdentifiers = await axios.get(`${config.apiServiceUrl}/collections?size=1&type=NonFungibleESDT`);
      const collection = collectionsIdentifiers.data.map((collection: any) => collection.collection);

      const collectionNft = await axios.get(`${config.apiServiceUrl}/collections/${collection}/nfts`);
      const collectionNftName = collectionNft.data.map((nft: any) => nft.name);

      const response = await axios.get(`${config.apiServiceUrl}/collections/${collection[0]}/nfts/count?search=${collectionNftName[0]}`);

      expect(response.status).toBe(200);
      expect(response.data).toStrictEqual(1);
    });

    it('should return nfts count for a collection with name', async () => {
      const collectionsIdentifiers = await axios.get(`${config.apiServiceUrl}/collections?size=1&type=NonFungibleESDT`);
      const collection = collectionsIdentifiers.data.map((collection: any) => collection.collection);

      const collectionNft = await axios.get(`${config.apiServiceUrl}/collections/${collection}/nfts`);
      const collectionNftName = collectionNft.data.map((nft: any) => nft.name);

      const response = await axios.get(`${config.apiServiceUrl}/collections/${collection[0]}/nfts/count?name=${collectionNftName[0]}`);

      expect(response.status).toBe(200);
      expect(response.data).toStrictEqual(1);
    });

    it('should return nfts count for a collection with tags', async () => {
      const collectionsIdentifiers = await axios.get(`${config.apiServiceUrl}/collections?size=1&type=NonFungibleESDT`);
      const collection = collectionsIdentifiers.data.map((collection: any) => collection.collection);

      const response = await axios.get(`${config.apiServiceUrl}/collections/${collection[0]}/nfts/count?tags=test`);

      expect(response.status).toBe(200);
      expect(response.data).toStrictEqual(5);
    });

    it('should return nfts count for a collection with identifiers', async () => {
      const collectionsIdentifiers = await axios.get(`${config.apiServiceUrl}/collections?size=2&type=NonFungibleESDT`);
      const collection = collectionsIdentifiers.data.map((collection: any) => collection.collection);

      const response = await axios.get(`${config.apiServiceUrl}/collections/${collection[0]}/nfts/count?identifiers=${[collection[0], collection[1]]}`);

      expect(response.status).toBe(200);
      expect(response.data).toStrictEqual(2);
    });

    it('should return nfts count for a collection with creator', async () => {
      const collectionsIdentifiers = await axios.get(`${config.apiServiceUrl}/collections?size=1&type=NonFungibleESDT`);
      const collection = collectionsIdentifiers.data.map((collection: any) => collection.collection);

      const response = await axios.get(`${config.apiServiceUrl}/collections/${collection[0]}/nfts/count?creator=${config.aliceAddress}`);

      expect(response.status).toBe(200);
      expect(response.data).toStrictEqual(5);
    });

    it('should return nfts count for a collection with isWhitelistedStorage', async () => {
      const collectionsIdentifiers = await axios.get(`${config.apiServiceUrl}/collections?size=1&type=NonFungibleESDT`);
      const collection = collectionsIdentifiers.data.map((collection: any) => collection.collection);

      const response = await axios.get(`${config.apiServiceUrl}/collections/${collection[0]}/nfts/count?isWhitelistedStorage=false`);

      expect(response.status).toBe(200);
      expect(response.data).toStrictEqual(5);
    });

    it('should return nfts count for a collection with hasUris', async () => {
      const collectionsIdentifiers = await axios.get(`${config.apiServiceUrl}/collections?size=1&type=NonFungibleESDT`);
      const collection = collectionsIdentifiers.data.map((collection: any) => collection.collection);

      const response = await axios.get(`${config.apiServiceUrl}/collections/${collection[0]}/nfts/count?hasUris=true`);

      expect(response.status).toBe(200);
      expect(response.data).toStrictEqual(5);
    });

    it('should return nfts count for a collection with nonceBefore', async () => {
      const collectionsIdentifiers = await axios.get(`${config.apiServiceUrl}/collections?size=1&type=NonFungibleESDT`);
      const collection = collectionsIdentifiers.data.map((collection: any) => collection.collection);

      const firstSet = await axios.get(`${config.apiServiceUrl}/collections/${collection[0]}/nfts/count?nonceBefore=1`);
      const secondSet = await axios.get(`${config.apiServiceUrl}/collections/${collection[0]}/nfts/count?nonceBefore=2`);

      expect(firstSet.status).toBe(200);
      expect(secondSet.status).toBe(200);
      expect(firstSet.data).toStrictEqual(1);
      expect(secondSet.data).toStrictEqual(2);
    });

    it('should return nfts count for a collection with nonceAfter', async () => {
      const collectionsIdentifiers = await axios.get(`${config.apiServiceUrl}/collections?size=1&type=NonFungibleESDT`);
      const collection = collectionsIdentifiers.data.map((collection: any) => collection.collection);

      const response = await axios.get(`${config.apiServiceUrl}/collections/${collection[0]}/nfts/count?nonceAfter=2`);

      expect(response.status).toBe(200);
      expect(response.data).toStrictEqual(4);
    });
  });

  describe('GET /collections/:collection/accounts', () => {
    it('should return accounts for a collection', async () => {
      const collectionsIdentifiers = await axios.get(`${config.apiServiceUrl}/collections?size=1&type=NonFungibleESDT`);
      const collection = collectionsIdentifiers.data.map((collection: any) => collection.collection);

      const response = await axios.get(`${config.apiServiceUrl}/collections/${collection[0]}/accounts`);

      for (const account of response.data) {
        expect(account.address).toBe(config.aliceAddress);
        expect(account.balance).toStrictEqual("1");
      }
    });

    it('should return accounts for a collection with from and size', async () => {
      const collectionsIdentifiers = await axios.get(`${config.apiServiceUrl}/collections?size=1&type=NonFungibleESDT`);
      const collection = collectionsIdentifiers.data.map((collection: any) => collection.collection);

      const response = await axios.get(`${config.apiServiceUrl}/collections/${collection[0]}/accounts?from=0&size=1`);

      expect(response.status).toBe(200);
      expect(response.data.length).toStrictEqual(1);

      for (const account of response.data) {
        expect(account.address).toBe(config.aliceAddress);
        expect(account.balance).toStrictEqual("1");
      }
    });

    it('should return accounts for a collection with identifier', async () => {
      const collectionsIdentifiers = await axios.get(`${config.apiServiceUrl}/collections?size=1&type=NonFungibleESDT`);
      const collection = collectionsIdentifiers.data.map((collection: any) => collection.collection);

      const response = await axios.get(`${config.apiServiceUrl}/collections/${collection[0]}/accounts?identifier=${collection[0]}`);

      expect(response.status).toBe(200);
      expect(response.data.length).toStrictEqual(5);

      for (const account of response.data) {
        expect(account.address).toBe(config.aliceAddress);
        expect(account.balance).toStrictEqual("1");
      }
    });
  });
});

