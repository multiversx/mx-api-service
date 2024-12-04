import axios from "axios";
import { config } from "./config/env.config";
import { ChainSimulatorUtils } from "./utils/test.utils";

describe('Dapp config e2e tests with chain simulator', () => {
  beforeAll(async () => {
    await ChainSimulatorUtils.waitForEpoch(2);
  });

  describe('GET /dapp/config', () => {
    it('should return status code 200 and dapp config', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/dapp/config`);
      expect(response.status).toBe(200);
    });

    it('should return dapp config with all required properties', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/dapp/config`);
      const dappConfig = response.data;

      expect(dappConfig).toEqual(expect.objectContaining({
        id: expect.any(String),
        name: expect.any(String),
        egldLabel: expect.any(String),
        decimals: expect.any(String),
        egldDenomination: expect.any(String),
        gasPerDataByte: expect.any(String),
        apiTimeout: expect.any(String),
        walletConnectDeepLink: expect.any(String),
        walletConnectBridgeAddresses: expect.any(Array),
        walletAddress: expect.any(String),
        apiAddress: expect.any(String),
        explorerAddress: expect.any(String),
        chainId: expect.any(String),
      }));
    });
  });
});
