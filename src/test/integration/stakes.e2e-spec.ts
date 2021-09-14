import { Test } from "@nestjs/testing";
import { StakeService } from "src/endpoints/stake/stake.service";
import { PublicAppModule } from "src/public.app.module";
import { Constants } from "src/utils/constants";
import Initializer from "./e2e-init";

describe('Stake Service', () => {
  let stakeService: StakeService;
  let globalStake: any;

  beforeAll(async () => {
    await Initializer.initialize();
  }, Constants.oneHour() * 1000);

  beforeEach(async () => {
    const publicAppModule = await Test.createTestingModule({
      imports: [PublicAppModule],
    }).compile();

    stakeService = publicAppModule.get<StakeService>(StakeService);
    globalStake = await stakeService.getGlobalStake();
  });

  describe('Stake', () => {
    it('global stake should have totalValidators, activeValidators, queueSize and totalStaked', async () => {
      expect(globalStake).toHaveProperty('totalValidators');
      expect(globalStake).toHaveProperty('activeValidators');
      expect(globalStake).toHaveProperty('queueSize');
      expect(globalStake).toHaveProperty('totalStaked');
    });
  });
});