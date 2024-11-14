import axios from "axios";
import { fundAddress } from "./chain.simulator.operations";

const CHAIN_SIMULATOR_URL = 'http://localhost:8085';
//const ELASTIC_SEARCH_URL = 'http://localhost:9200';
const API_SERVICE_URL = 'http://localhost:3001';
const ALICE_ADDRESS = 'erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th';

describe('EventProcessor e2e tests with chain simulator', () => {
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

  it('accounts endpoint should work', async () => {
    await fundAddress(CHAIN_SIMULATOR_URL, ALICE_ADDRESS);
    const csResponse = await axios.get(`${CHAIN_SIMULATOR_URL}/address/${ALICE_ADDRESS}`);
    console.log(csResponse);

    try {
      const apiServiceResponse = await axios.get(`${API_SERVICE_URL}/accounts/${ALICE_ADDRESS}`);
      console.log(JSON.stringify(apiServiceResponse).toString());
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('Error response:', error.response);
      } else {
        console.error('Unexpected error:', error);
      }
    }
  }, 100000);
});
