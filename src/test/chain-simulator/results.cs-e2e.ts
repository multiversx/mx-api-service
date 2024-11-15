import axios from 'axios';

const CHAIN_SIMULATOR_URL = 'http://localhost:8085';
const API_SERVICE_URL = 'http://localhost:3001';

describe('Smart Contract Results e2e tests with chain simulator', () => {
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
    } catch (e) {
      console.error(e);
    }
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /results', () => {
    it('should return status code 200 and a list of smart contract results', async () => {
      const response = await axios.get(`${API_SERVICE_URL}/results`);
      const results = response.data;
      expect(response.status).toBe(200);
      expect(results).toBeInstanceOf(Array);
    });

    it('should return filtered smart contract results by sender', async () => {
      const sender =
        'erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqplllst77y4l';
      const response = await axios.get(
        `${API_SERVICE_URL}/results?sender=${sender}`,
      );
      const results = response.data;
      expect(response.status).toBe(200);
      for (const result of results) {
        expect(result.sender).toBe(sender);
      }
    });

    it('should return filtered smart contract results by receiver', async () => {
      const receiver =
        'erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqplllst77y4l';
      const response = await axios.get(
        `${API_SERVICE_URL}/results?receiver=${receiver}`,
      );
      const results = response.data;
      expect(response.status).toBe(200);
      for (const result of results) {
        expect(result.receiver).toBe(receiver);
      }
    });

    // Skipped due to the lack of smart contract results with function 'transfer'
    it.skip('should return filtered smart contract results by function', async () => {
      const functionName = 'transfer';
      const response = await axios.get(
        `${API_SERVICE_URL}/results?function=${functionName}`,
      );
      const results = response.data;
      expect(response.status).toBe(200);
      for (const result of results) {
        expect(result.function).toBe(functionName);
      }
    });
  });

  describe('GET /results/count', () => {
    it('should return status code 200 and the total count of smart contract results', async () => {
      const response = await axios.get(`${API_SERVICE_URL}/results/count`);
      const count = response.data;
      expect(response.status).toBe(200);
      expect(count).toBeGreaterThanOrEqual(1);
      expect(typeof count).toBe('number');
    });

    it('should return filtered smart contract results count by sender', async () => {
      const sender =
        'erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqplllst77y4l';
      const response = await axios.get(
        `${API_SERVICE_URL}/results/count?sender=${sender}`,
      );
      const count = response.data;
      expect(response.status).toBe(200);
      expect(typeof count).toBe('number');
    });

    it('should return filtered smart contract results count by receiver', async () => {
      const receiver =
        'erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqplllst77y4l';
      const response = await axios.get(
        `${API_SERVICE_URL}/results/count?receiver=${receiver}`,
      );
      const count = response.data;
      expect(response.status).toBe(200);
      expect(typeof count).toBe('number');
    });

    it('should return filtered smart contract results count by function', async () => {
      const functionName = 'transfer';
      const response = await axios.get(
        `${API_SERVICE_URL}/results/count?function=${functionName}`,
      );
      const count = response.data;
      expect(response.status).toBe(200);
      expect(typeof count).toBe('number');
    });
  });

  describe('GET /results/:scHash', () => {
    it('should return status code 200 and smart contract result details', async () => {
      const scHash =
        '4c4808508dc4a6d063ad1853ab546da978fcc05260c5b93b22afe5903d09a1a0';
      const response = await axios.get(`${API_SERVICE_URL}/results/${scHash}`);
      const result = response.data;
      expect(response.status).toBe(200);
      expect(result).toHaveProperty('hash', scHash);
    });

    it('should return status code 400 for invalid smart contract hash', async () => {
      const scHash = 'nonExistentHash';
      try {
        await axios.get(`${API_SERVICE_URL}/results/${scHash}`);
      } catch (error: any) {
        expect(error.response.status).toBe(400);
      }
    });
  });
});
