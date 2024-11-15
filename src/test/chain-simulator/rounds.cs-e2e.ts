import axios from 'axios';

const CHAIN_SIMULATOR_URL = 'http://localhost:8085';
const API_SERVICE_URL = 'http://localhost:3001';

describe('Rounds e2e tests with chain simulator', () => {
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
          fail('Chain simulator not started!');
        }
      }
    } catch (e) {
      console.error(e);
    }
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /rounds', () => {
    it('sgould return status code 200', async () => {
      const response = await axios.get(`${API_SERVICE_URL}/rounds`);
      expect(response.status).toBe(200);
    });

    it('should return status code 200 and a list of rounds', async () => {
      const response = await axios.get(`${API_SERVICE_URL}/rounds`);
      const rounds = response.data;
      expect(response.status).toBe(200);
      expect(rounds).toBeInstanceOf(Array);
    });

    it('should support pagination and return 10 rounds', async () => {
      const response = await axios.get(`${API_SERVICE_URL}/rounds?size=10`);
      const rounds = response.data;

      expect(response.status).toBe(200);
      expect(rounds.length).toBe(10);
      expect(Array.isArray(rounds)).toBe(true);
    });

    it('should return filtered rounds by shard', async () => {
      const shard = 0;
      const response = await axios.get(`${API_SERVICE_URL}/rounds?shard=${shard}`);

      expect(response.status).toBe(200);
      for (const round of response.data) {
        expect(round.shard).toStrictEqual(shard);
      }
    });

    it('should return filtered rounds by epoch', async () => {
      const epoch = 2;
      const response = await axios.get(`${API_SERVICE_URL}/rounds?epoch=${epoch}`);
      expect(response.status).toBe(200);

      for (const round of response.data) {
        expect(round.epoch).toBe(epoch);
      }
    });
  });

  describe('GET /rounds/count', () => {
    it('should return status code 200 and the total count of rounds', async () => {
      const response = await axios.get(`${API_SERVICE_URL}/rounds/count`);
      const rounds = response.data;

      expect(response.status).toBe(200);
      expect(typeof rounds).toBe('number');
      expect(rounds).toBeGreaterThan(10);
    });

    it('should return filtered round count by shard', async () => {
      const shard = 0;
      const response = await axios.get(`${API_SERVICE_URL}/rounds/count?shard=${shard}`);
      const rounds = response.data;

      expect(response.status).toBe(200);
      expect(typeof rounds).toBe('number');
    });

    it('should return filtered round count by epoch', async () => {
      const epoch = 2;
      const response = await axios.get(`${API_SERVICE_URL}/rounds/count?epoch=${epoch}`);
      const rounds = response.data;

      expect(response.status).toBe(200);
      expect(typeof rounds).toBe('number');
    });

    it('should return filtered round count 0 by epoch if epoch value is high', async () => {
      const epoch = 10000;
      const response = await axios.get(`${API_SERVICE_URL}/rounds/count?epoch=${epoch}`);
      const rounds = response.data;

      expect(response.status).toBe(200);
      expect(typeof rounds).toBe('number');
      expect(rounds).toStrictEqual(0);
    });
  });

  describe('GET /rounds/:shard/:round', () => {
    it('should return status code 200 and round details', async () => {
      const shard = 0;
      const round = 1;
      const response = await axios.get(`${API_SERVICE_URL}/rounds/${shard}/${round}`);
      const roundDetails = response.data;
      expect(response.status).toBe(200);
      expect(roundDetails).toHaveProperty('shard', shard);
      expect(roundDetails).toHaveProperty('round', round);
    });

    it('should return status code 404 for non-existent round ', async () => {
      const shard = 0;
      const round = 999999;
      try {
        await axios.get(`${API_SERVICE_URL}/rounds/${shard}/${round}`);
      } catch (error: any) {
        expect(error.response.status).toBe(404);
      }
    });
  });
});
