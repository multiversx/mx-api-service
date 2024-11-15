import axios from "axios";
const CHAIN_SIMULATOR_URL = 'http://localhost:8085';
const API_SERVICE_URL = 'http://localhost:3001';

describe('Blocks e2e tests with chain simulator', () => {
  beforeAll(async () => {
    try {
      const response = await axios.get(`${CHAIN_SIMULATOR_URL}/simulator/observers`);
      let numRetries = 0;
      while (true) {
        if (response.status === 200) {
          await axios.post(`${CHAIN_SIMULATOR_URL}/simulator/generate-blocks-until-epoch-reached/2`, {});
          break;
        }

        numRetries += 1;
        if (numRetries > 50) {
          fail("Chain simulator not started!");
        }
      }
    } catch (e) {
      console.error(e);
    }
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /blocks', () => {
    it('should handle invalid block requests gracefully', async () => {
      try {
        await axios.get(`${API_SERVICE_URL}/blocks/invalid`);
      } catch (error: any) {
        expect(error.response.status).toBe(400);
      }
    });
  });

  describe('GET /blocks/count', () => {
    it('should return blocks count', async () => {
      const response = await axios.get(`${API_SERVICE_URL}/blocks/count`);
      const count = response.data;

      expect(count).toBeGreaterThan(0);
    });

    it('should return blocks count filter by shard', async () => {
      const response = await axios.get(`${API_SERVICE_URL}/blocks/count?shard=1`);
      const count = response.data;

      expect(count).toBeGreaterThan(0);
    });

    it('should return blocks count filter by epoch', async () => {
      const response = await axios.get(`${API_SERVICE_URL}/blocks/count?epoch=1`);
      const count = response.data;

      expect(count).toBeGreaterThan(1);
    });

    it('should return blocks count 0 if epoch value is to high', async () => {
      const response = await axios.get(`${API_SERVICE_URL}/blocks/count?epoch=10`);
      const count = response.data;

      expect(count).toStrictEqual(0);
    });

    it('should return blocks count filter by nonce', async () => {
      const response = await axios.get(`${API_SERVICE_URL}/blocks/count?nonce=0`);
      const count = response.data;

      expect(count).toBeGreaterThan(0);
    });
  });

  describe('GET /blocks filter tests', () => {
    it('should support pagination', async () => {
      const response = await axios.get(`${API_SERVICE_URL}/blocks?size=10`);
      const blocks = response.data;

      expect(blocks).toBeInstanceOf(Array);
      expect(blocks.length).toBeLessThanOrEqual(10);
    });

    it('should filter blocks by shard', async () => {
      const response = await axios.get(`${API_SERVICE_URL}/blocks?shard=1`);
      const blocks = response.data;

      for (const block of blocks) {
        expect(block.shard).toBe(1);
      }
    });

    it('should filter blocks by epoch', async () => {
      const response = await axios.get(`${API_SERVICE_URL}/blocks?epoch=2`);
      const blocks = response.data;

      for (const block of blocks) {
        expect(block.epoch).toBe(2);
      }
    });
  });
});
