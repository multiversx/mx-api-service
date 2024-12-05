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

      const requiredProps = [
        'id',
        'name',
        'egldLabel',
        'decimals',
        'egldDenomination',
        'gasPerDataByte',
        'apiTimeout',
        'walletConnectDeepLink',
        'walletConnectBridgeAddresses',
        'walletAddress',
        'apiAddress',
        'explorerAddress',
        'chainId',
      ];

      for (const prop of requiredProps) {
        expect(dappConfig).toHaveProperty(prop);
      }
    });
  });
});
