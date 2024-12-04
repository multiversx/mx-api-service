import axios from "axios";
import { config } from "./config/env.config";
import { ChainSimulatorUtils } from "./utils/test.utils";

describe('Identities e2e tests with chain simulator', () => {
  beforeAll(async () => {
    await ChainSimulatorUtils.waitForEpoch(2);
  });

  describe('GET /identities', () => {
    it('should return status code 200 and a list of identities', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/identities`);
      expect(response.status).toBe(200);
      expect(response.data).toBeInstanceOf(Array);
    });

    it('should support pagination', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/identities?size=1`);
      expect(response.status).toBe(200);
      expect(response.data.length).toBe(1);
    });

    it('should return identities with expected properties', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/identities`);
      expect(response.status).toBe(200);
      expect(response.data[0]).toEqual(
        expect.objectContaining({
          locked: expect.any(String),
          distribution: expect.objectContaining({
            direct: expect.any(Number),
          }),
          name: expect.any(String),
          score: expect.any(Number),
          validators: expect.any(Number),
          stake: expect.any(String),
          topUp: expect.any(String),
          stakePercent: expect.any(Number),
          apr: expect.any(Number),
          rank: expect.any(Number),
        })
      );
    });
  });
});
