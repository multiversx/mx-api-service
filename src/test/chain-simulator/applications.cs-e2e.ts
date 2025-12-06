import axios from "axios";
import { config } from "./config/env.config";

describe.skip('Applications e2e tests with chain simulator', () => {
  describe('GET /applications', () => {
    it('should return status code 200 and a list of applications', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/applications`);
      expect(response.status).toBe(200);
      expect(response.data).toBeInstanceOf(Array);
    });

    it('should support pagination', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/applications?from=0&size=1`);
      expect(response.status).toBe(200);
      expect(response.data).toBeInstanceOf(Array);
      expect(response.data.length).toStrictEqual(1);
    });

    it('should return applications with expected properties', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/applications`);
      const application = response.data[0];

      const requiredProps = [
        'address',
        'balance',
        'usersCount',
        'feesCaptured',
        'deployedAt',
        'deployTxHash',
        'isVerified',
        'txCount',
        'developerReward',
      ];

      for (const prop of requiredProps) {
        expect(application).toHaveProperty(prop);
      }
    });

    it('should return applications with all fields populated', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/applications`);
      expect(response.status).toBe(200);
      expect(response.data).toBeInstanceOf(Array);

      if (response.data.length > 0) {
        const application = response.data[0];
        expect(application).toHaveProperty('txCount');
        expect(application).toHaveProperty('balance');
        expect(application).toHaveProperty('address');
        expect(typeof application.txCount).toBe('number');
        expect(typeof application.balance).toBe('string');
        expect(typeof application.address).toBe('string');
      }
    });
  });

  describe('GET /applications/:address', () => {
    it('should return status code 200 and an application', async () => {
      const applicationsResponse = await axios.get(`${config.apiServiceUrl}/applications`);
      if (applicationsResponse.data.length > 0) {
        const response = await axios.get(`${config.apiServiceUrl}/applications/${applicationsResponse.data[0].address}`);
        expect(response.status).toBe(200);
        expect(response.data).toBeInstanceOf(Object);
      }
    });

    it('should return application details with all required fields', async () => {
      const applicationsResponse = await axios.get(`${config.apiServiceUrl}/applications`);
      if (applicationsResponse.data.length > 0) {
        const response = await axios.get(`${config.apiServiceUrl}/applications/${applicationsResponse.data[0].address}`);
        expect(response.status).toBe(200);
        expect(response.data).toBeInstanceOf(Object);

        const requiredProps = [
          'address',
          'balance',
          'usersCount',
          'feesCaptured',
          'deployedAt',
          'deployTxHash',
          'isVerified',
          'txCount',
          'developerReward',
        ];

        for (const prop of requiredProps) {
          expect(response.data).toHaveProperty(prop);
        }
      }
    });
  });

  describe('GET /applications/count', () => {
    it('should return the number of applications', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/applications/count`);
      expect(response.status).toBe(200);
      expect(typeof response.data).toBe('number');
    });

    it('should return filtered applications count with search parameter', async () => {
      const applicationsResponse = await axios.get(`${config.apiServiceUrl}/applications`);
      if (applicationsResponse.data.length > 0) {
        const firstApplicationAddress = applicationsResponse.data[0].address;
        const response = await axios.get(`${config.apiServiceUrl}/applications/count?search=${firstApplicationAddress}`);
        expect(response.status).toBe(200);
        expect(typeof response.data).toBe('number');
        expect(response.data).toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe('GET /applications - Advanced filtering and pagination', () => {
    it('should support complex filtering with multiple parameters', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/applications?from=0&size=10&isVerified=true&hasAssets=true`);
      expect(response.status).toBe(200);
      expect(response.data).toBeInstanceOf(Array);
    });

    it('should handle different sort options', async () => {
      const sortOptions = ['balance', 'transfersLast24h', 'timestamp'];

      for (const sort of sortOptions) {
        const response = await axios.get(`${config.apiServiceUrl}/applications?sort=${sort}&order=desc`);
        expect(response.status).toBe(200);
        expect(response.data).toBeInstanceOf(Array);
      }
    });

    it('should filter by owner address', async () => {
      const applicationsResponse = await axios.get(`${config.apiServiceUrl}/applications`);
      if (applicationsResponse.data.length > 0) {
        // Use a valid address format for testing
        const response = await axios.get(`${config.apiServiceUrl}/applications?ownerAddress=erd1qqqqqqqqqqqqqpgqra3gguhxnwt9rp4dsq3s3zpaaupvpsv4srgqfyth3s`);
        expect(response.status).toBe(200);
        expect(response.data).toBeInstanceOf(Array);
      }
    });

    it('should filter by multiple addresses', async () => {
      const applicationsResponse = await axios.get(`${config.apiServiceUrl}/applications`);
      if (applicationsResponse.data.length > 0) {
        const addresses = applicationsResponse.data.slice(0, 2).map((app: any) => app.address).join(',');
        const response = await axios.get(`${config.apiServiceUrl}/applications?addresses=${addresses}`);
        expect(response.status).toBe(200);
        expect(response.data).toBeInstanceOf(Array);
      }
    });

    it('should handle invalid addresses array (too many addresses)', async () => {
      const addresses = Array(30).fill('erd1qqqqqqqqqqqqqpgqra3gguhxnwt9rp4dsq3s3zpaaupvpsv4srgqfyth3s').join(',');
      const response = await axios.get(`${config.apiServiceUrl}/applications?addresses=${addresses}`);
      expect(response.status).toBe(400);
    });

    it('should filter by usersCountRange', async () => {
      const ranges = ['24h', '7d', '30d', 'allTime'];

      for (const range of ranges) {
        const response = await axios.get(`${config.apiServiceUrl}/applications?usersCountRange=${range}`);
        expect(response.status).toBe(200);
        expect(response.data).toBeInstanceOf(Array);
      }
    });

    it('should filter by feesRange', async () => {
      const ranges = ['24h', '7d', '30d', 'allTime'];

      for (const range of ranges) {
        const response = await axios.get(`${config.apiServiceUrl}/applications?feesRange=${range}`);
        expect(response.status).toBe(200);
        expect(response.data).toBeInstanceOf(Array);
      }
    });

    it('should handle search by partial address', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/applications?search=erd1`);
      expect(response.status).toBe(200);
      expect(response.data).toBeInstanceOf(Array);
    });

    it('should validate pagination bounds', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/applications?from=0&size=100`);
      expect(response.status).toBe(200);
      expect(response.data).toBeInstanceOf(Array);
      expect(response.data.length).toBeLessThanOrEqual(100);
    });
  });

  describe('GET /applications/:address - Single application details', () => {
    it('should handle usersCountRange parameter for single application', async () => {
      const applicationsResponse = await axios.get(`${config.apiServiceUrl}/applications`);
      if (applicationsResponse.data.length > 0) {
        const applicationAddress = applicationsResponse.data[0].address;
        const response = await axios.get(`${config.apiServiceUrl}/applications/${applicationAddress}?usersCountRange=7d`);
        expect(response.status).toBe(200);
        expect(response.data).toHaveProperty('usersCount');
        expect(typeof response.data.usersCount).toBe('number');
      }
    });

    it('should handle feesRange parameter for single application', async () => {
      const applicationsResponse = await axios.get(`${config.apiServiceUrl}/applications`);
      if (applicationsResponse.data.length > 0) {
        const applicationAddress = applicationsResponse.data[0].address;
        const response = await axios.get(`${config.apiServiceUrl}/applications/${applicationAddress}?feesRange=30d`);
        expect(response.status).toBe(200);
        expect(response.data).toHaveProperty('feesCaptured');
        expect(typeof response.data.feesCaptured).toBe('string');
      }
    });

    it('should handle non-existent application address', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/applications/erd1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq6gq4c6`);
      expect([404, 500]).toContain(response.status); // May return 404 or 500 depending on implementation
    });

    it('should handle invalid application address format', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/applications/invalid-address`);
      expect([400, 404]).toContain(response.status);
    });

    it('should return correct data types for all fields', async () => {
      const applicationsResponse = await axios.get(`${config.apiServiceUrl}/applications`);
      if (applicationsResponse.data.length > 0) {
        const applicationAddress = applicationsResponse.data[0].address;
        const response = await axios.get(`${config.apiServiceUrl}/applications/${applicationAddress}`);
        expect(response.status).toBe(200);

        const app = response.data;
        expect(typeof app.address).toBe('string');
        expect(typeof app.balance).toBe('string');
        expect(typeof app.usersCount).toBe('number');
        expect(typeof app.feesCaptured).toBe('string');
        expect(typeof app.deployedAt).toBe('number');
        expect(typeof app.deployTxHash).toBe('string');
        expect(typeof app.isVerified).toBe('boolean');
        expect(typeof app.txCount).toBe('number');
        expect(typeof app.developerReward).toBe('string');
      }
    });
  });
});
