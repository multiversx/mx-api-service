import { CacheService } from "@multiversx/sdk-nestjs-cache";
import { Test } from "@nestjs/testing";
import { ApiConfigService } from "src/common/api-config/api.config.service";
import { NetworkEconomics } from "src/common/gateway/entities/network.economics";
import { GatewayService } from "src/common/gateway/gateway.service";
import { NetworkService } from "src/endpoints/network/network.service";
import { NodeService } from "src/endpoints/nodes/node.service";
import { StakeService } from "src/endpoints/stake/stake.service";
import { VmQueryService } from "src/endpoints/vm.query/vm.query.service";
import { CacheInfo } from "src/utils/cache.info";

describe('Stake Service', () => {
  let stakeService: StakeService;
  let cachingService: CacheService;
  let vmQueryService: VmQueryService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        StakeService,
        {
          provide: CacheService,
          useValue:
          {
            getOrSet: jest.fn(),
          },
        },
        {
          provide: VmQueryService,
          useValue: {
            vmQuery: jest.fn(),
          },
        },
        {
          provide: ApiConfigService,
          useValue: {
            getStakingContractAddress: jest.fn(),
            getAuctionContractAddress: jest.fn(),
          },
        },
        {
          provide: NodeService,
          useValue: {
            getAllNodes: jest.fn(),
          },
        },
        {
          provide: GatewayService,
          useValue: {
            getNetworkEconomics: jest.fn(),
          },
        },
        {
          provide: NetworkService,
          useValue: {
            getNetworkConfig: jest.fn(),
          },
        },
      ],
    }).compile();

    stakeService = moduleRef.get<StakeService>(StakeService);
    cachingService = moduleRef.get<CacheService>(CacheService);
    vmQueryService = moduleRef.get<VmQueryService>(VmQueryService);
  });

  describe('getGlobalStake', () => {
    it('should return global stake with total staked value', async () => {
      const expected = { validators: { totalValidators: 1, activeValidators: 1, queueSize: 1 }, totalStaked: '123456' };

      const economicsMocks: NetworkEconomics = {
        erd_dev_rewards: '100',
        erd_epoch_for_economics_data: 10,
        erd_inflation: '1',
        erd_total_base_staked_value: '20',
        erd_total_fees: '10',
        erd_total_supply: '1000',
        erd_total_top_up_value: '100',
      };

      jest.spyOn(stakeService, 'getValidators').mockResolvedValue(expected.validators);
      jest.spyOn(stakeService['gatewayService'], 'getNetworkEconomics').mockResolvedValueOnce(economicsMocks);

      // eslint-disable-next-line require-await
      jest.spyOn(cachingService, 'getOrSet').mockImplementationOnce(async () => expected);

      const result = await stakeService.getGlobalStake();
      expect(result).toEqual(expected);
    });

    it('should return cached value', async () => {
      const cachedValue = {
        totalValidators: 3200,
        activeValidators: 3100,
        queueSize: 1,
        totalStaked: '123456',
      };

      // eslint-disable-next-line require-await
      jest.spyOn(cachingService, 'getOrSet').mockImplementationOnce(async () => cachedValue);

      const result = await stakeService.getGlobalStake();

      expect(cachingService.getOrSet).toHaveBeenCalledTimes(1);
      expect(cachingService.getOrSet).toHaveBeenCalledWith(
        CacheInfo.GlobalStake.key,
        expect.any(Function),
        CacheInfo.GlobalStake.ttl,
      );
      expect(vmQueryService.vmQuery).not.toHaveBeenCalled();
      expect(result).toEqual(cachedValue);
    });
  });

  describe('getGlobalStakeRaw', () => {
    it('should return global stake information', async () => {
      const validators = {
        totalValidators: 10,
        activeValidators: 5,
        queueSize: 100,
      };

      const economicsMocks: NetworkEconomics = {
        erd_dev_rewards: '100',
        erd_epoch_for_economics_data: 10,
        erd_inflation: '1',
        erd_total_base_staked_value: '20',
        erd_total_fees: '10',
        erd_total_supply: '1000',
        erd_total_top_up_value: '100',
      };

      const expectedTotalStaked = '120';

      jest.spyOn(stakeService, 'getValidators').mockResolvedValue(validators);
      jest.spyOn(stakeService['gatewayService'], 'getNetworkEconomics').mockResolvedValue(economicsMocks);

      const result = await stakeService.getGlobalStakeRaw();

      expect(result.totalValidators).toEqual(validators.totalValidators);
      expect(result.activeValidators).toEqual(validators.activeValidators);
      expect(result.queueSize).toEqual(validators.queueSize);
      expect(result.totalStaked).toEqual(expectedTotalStaked);
    });
  });

  describe('getValidators', () => {
    it('should return details about validators and return valid results', async () => {
      const queueSize = Buffer.from('10', 'ascii').toString('base64');
      const nodesMock = require('../../mocks/nodes.mock.json');

      jest.spyOn(stakeService['vmQueryService'], 'vmQuery').mockResolvedValue([queueSize]);
      jest.spyOn(stakeService['nodeService'], 'getAllNodes').mockResolvedValue(nodesMock);

      const result = await stakeService.getValidators();

      expect(result.totalValidators).toEqual(97);
      expect(result.activeValidators).toEqual(96);
      expect(result.queueSize).toEqual(parseInt(Buffer.from(queueSize, 'base64').toString()));
    });
  });
});
