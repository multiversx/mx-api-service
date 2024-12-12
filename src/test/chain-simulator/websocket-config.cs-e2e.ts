import axios from "axios";
import { config } from "./config/env.config";
import { ChainSimulatorUtils } from "./utils/test.utils";

describe('Websocket config e2e tests with chain simulator', () => {
  beforeAll(async () => {
    await ChainSimulatorUtils.waitForEpoch(2);
  });

  describe('GET /websocket/config', () => {
    it('should return status code 200 and websocket config', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/websocket/config`);
      expect(response.status).toBe(200);
      expect(response.data.url).toStrictEqual('socket-api-fra.multiversx.com');
    });
  });
});
