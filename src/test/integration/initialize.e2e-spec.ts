
import { Constants } from "src/utils/constants";
import Initializer from "./e2e-init";

describe('Initialize tests', () => {
  beforeAll(async () => {
    await Initializer.initialize();
  }, Constants.oneHour() * 1000);

  describe('Initalize', () => {
    it('test for initialize', () => {
      expect(true).toBeTruthy();
    });
  });
});
