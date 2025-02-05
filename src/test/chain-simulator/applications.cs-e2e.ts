import axios from "axios";
import { config } from "./config/env.config";

describe('Applications e2e tests with chain simulator', () => {
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
        'contract',
        'deployer',
        'owner',
        'codeHash',
        'timestamp',
      ];

      for (const prop of requiredProps) {
        expect(application).toHaveProperty(prop);
      }
    });

    it('should return applications with txCount field if withTxCount query param is true', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/applications?withTxCount=true`);
      expect(response.status).toBe(200);
      expect(response.data).toBeInstanceOf(Array);
      expect(response.data[0]).toHaveProperty('txCount');
    });
  });

  describe('GET /applications/:address', () => {
    it('should return status code 200 and an application', async () => {
      const application = await axios.get(`${config.apiServiceUrl}/applications`);
      const response = await axios.get(`${config.apiServiceUrl}/applications/${application.data[0].contract}`);
      expect(response.status).toBe(200);
      expect(response.data).toBeInstanceOf(Object);
    });

    it('should return application details with txCount and balance fields', async () => {
      const application = await axios.get(`${config.apiServiceUrl}/applications`);
      const response = await axios.get(`${config.apiServiceUrl}/applications/${application.data[0].contract}`);
      expect(response.status).toBe(200);
      expect(response.data).toBeInstanceOf(Object);
      expect(response.data).toHaveProperty('txCount');
      expect(response.data).toHaveProperty('balance');
    });
  });

  describe('GET /applications/count', () => {
    it('should return the number of applications', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/applications/count`);
      expect(response.status).toBe(200);
      expect(typeof response.data).toBe('number');
    });

    it('should return the number of applications with the given timestamp ( before )', async () => {
      const applicationsCount = await axios.get(`${config.apiServiceUrl}/applications`);
      const response = await axios.get(`${config.apiServiceUrl}/applications/count?before=${applicationsCount.data[0].timestamp}`);
      expect(response.status).toBe(200);
      expect(typeof response.data).toBe('number');
    });
  });
});
