import { Test } from "@nestjs/testing";
import { StakeModule } from "src/endpoints/stake/stake.module";
import { StakeService } from "src/endpoints/stake/stake.service";
import { Stake } from "../../endpoints/stake/entities/stake";
import { StakeTopup } from "../../endpoints/stake/entities/stake.topup";
import '../../utils/extensions/jest.extensions';

describe('Stake Service', () => {
  let stakeService: StakeService;
  let globalStake: any;

  const nodes: string[] = [
    'erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqhllllsajxzat',
    'erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqrhlllls062tu4',
  ];

  const node: string = 'erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqhllllsajxzat';

  beforeAll(async () => {
    const publicAppModule = await Test.createTestingModule({
      imports: [StakeModule],
    }).compile();

    stakeService = publicAppModule.get<StakeService>(StakeService);
    globalStake = await stakeService.getGlobalStake();
  });

  describe('Stake', () => {
    it('global stake should have totalValidators, activeValidators, queueSize and totalStaked', () => {
      expect(globalStake).toHaveProperty('totalValidators');
      expect(globalStake).toHaveProperty('activeValidators');
      expect(globalStake).toHaveProperty('queueSize');
      expect(globalStake).toHaveProperty('totalStaked');
    });
  });

  describe('Get Global Stake Raw', () => {
    it('should return global stake raw', async () => {
      const stake = await stakeService.getGlobalStake();
      expect(stake).toBeInstanceOf(Object);
      expect(stake).toHaveProperty('totalValidators');
      expect(stake).toHaveProperty('activeValidators');
      expect(stake).toHaveProperty('queueSize');
      expect(stake).toHaveProperty('totalStaked');
    });
  });

  describe('Get Validators', () => {
    it('should return global stake raw', async () => {
      const validators = await stakeService.getValidators();
      expect(validators).toBeInstanceOf(Object);
      expect(validators).toHaveProperty('totalValidators');
      expect(validators).toHaveProperty('activeValidators');
      expect(validators).toHaveProperty('queueSize');
    });
  });

  describe('Get Stakes', () => {
    it('should return stakes', async () => {
      const stakes = await stakeService.getStakes(nodes);

      for (const stake of stakes) {
        expect(stake).toHaveStructure(Object.keys(new Stake()));
      }
    });
  });

  describe('Get All Stakes For Address Nodes', () => {
    it('should return all stakes for a specific address nodes', async () => {
      const stakes = await stakeService.getAllStakesForAddressNodesRaw(node);
      expect(stakes).toHaveStructure(Object.keys(new StakeTopup()));
    });
  });

  describe('Get Stakes For Address', () => {
    it('should return  stake for a specific address', async () => {
      const stake = await stakeService.getStakeForAddress(node);
      expect(stake).toBeInstanceOf(Object);
    });
  });
});
