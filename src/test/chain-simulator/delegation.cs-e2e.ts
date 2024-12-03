import axios from 'axios';
import { config } from "./config/env.config";
import { ChainSimulatorUtils } from "./utils/test.utils";

describe('Delegation e2e tests with chain simulator', () => {
  beforeAll(async () => {
    await ChainSimulatorUtils.waitForEpoch(2);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /delegations', () => {
    it('should return status code 200', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/delegation`);
      expect(response.status).toBe(200);
    });

    it('should return delegation details', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/delegation`);
      const properties = Object.keys(response.data);

      expect(properties).toEqual(['stake', 'topUp', 'locked', 'minDelegation']);
    });
  });
});
