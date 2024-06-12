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
import * as fs from 'fs';
import * as path from 'path';
import { IdentitiesService } from "src/endpoints/identities/identities.service";
import { BlockService } from "src/endpoints/blocks/block.service";

describe('Stake Service', () => {
  let stakeService: StakeService;
  let cachingService: CacheService;
  let vmQueryService: VmQueryService;
  let apiConfigService: ApiConfigService;
  let gatewayService: GatewayService;
  let identitiesService: IdentitiesService;
  let nodeService: NodeService;

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
            isStakingV4Enabled: jest.fn(),
            getStakingV4ActivationEpoch: jest.fn(),
          },
        },
        {
          provide: NodeService,
          useValue: {
            getAllNodes: jest.fn(),
            getNodeCount: jest.fn(),
            getNodesWithAuctionDangerZoneCount: jest.fn(),
            getValidatorAuctions: jest.fn(),
          },
        },
        {
          provide: GatewayService,
          useValue: {
            getNetworkEconomics: jest.fn(),
            getValidatorAuctions: jest.fn(),
          },
        },
        {
          provide: NetworkService,
          useValue: {
            getNetworkConfig: jest.fn(),
          },
        },
        {
          provide: IdentitiesService,
          useValue: {
            getAllIdentities: jest.fn(),
          },
        },
        {
          provide: BlockService,
          useValue: {
            getCurrentEpoch: jest.fn(),
          },
        },
      ],
    }).compile();

    stakeService = moduleRef.get<StakeService>(StakeService);
    cachingService = moduleRef.get<CacheService>(CacheService);
    vmQueryService = moduleRef.get<VmQueryService>(VmQueryService);
    apiConfigService = moduleRef.get<ApiConfigService>(ApiConfigService);
    gatewayService = moduleRef.get<GatewayService>(GatewayService);
    identitiesService = moduleRef.get<IdentitiesService>(IdentitiesService);
    nodeService = moduleRef.get<NodeService>(NodeService);
  });

  describe('getGlobalStake', () => {
    it('should return global stake with total staked value', async () => {
      const expected = { validators: { totalValidators: 1, activeValidators: 1, inactiveValidators: 0, queueSize: 1 }, totalStaked: '123456' };

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
    it('should return global stake information, including minimumAuctionTopUp', async () => {
      const validators = {
        totalValidators: 10,
        activeValidators: 5,
        inactiveValidators: 0,
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
      const expectedMinimumAuctionQualifiedTopUp = '2500';
      const expectedNakamotoCoefficient = 4;

      jest.spyOn(stakeService, 'getValidators').mockResolvedValue(validators);
      jest.spyOn(stakeService['gatewayService'], 'getNetworkEconomics').mockResolvedValue(economicsMocks);
      jest.spyOn(stakeService, 'getMinimumAuctionTopUp').mockReturnValue(expectedMinimumAuctionQualifiedTopUp);
      jest.spyOn(stakeService, 'getNakamotoCoefficient').mockResolvedValue(expectedNakamotoCoefficient);
      jest.spyOn(apiConfigService, 'isStakingV4Enabled').mockReturnValue(true);
      jest.spyOn(apiConfigService, 'getStakingV4ActivationEpoch').mockReturnValue(1395);
      jest.spyOn(nodeService, 'getNodeCount').mockResolvedValue(100);

      const result = await stakeService.getGlobalStakeRaw();

      expect(result.totalValidators).toEqual(validators.totalValidators);
      expect(result.activeValidators).toEqual(validators.activeValidators);
      expect(result.queueSize).toEqual(validators.queueSize);
      expect(result.totalStaked).toEqual(expectedTotalStaked);
      expect(result.minimumAuctionQualifiedTopUp).toEqual(expectedMinimumAuctionQualifiedTopUp);
      expect(result.nakamotoCoefficient).toEqual(expectedNakamotoCoefficient);
      expect(result.totalObservers).toEqual(100);
    });
  });


  describe('getValidators', () => {
    //TBR
    it.skip('should return details about validators and return valid results', async () => {
      const queueSize = Buffer.from('10', 'ascii').toString('base64');
      const nodesMock = require('../../mocks/nodes.mock.json');

      jest.spyOn(apiConfigService, 'getStakingContractAddress').mockReturnValue('erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqllls0lczs7');
      jest.spyOn(stakeService['vmQueryService'], 'vmQuery').mockResolvedValue([queueSize]);
      jest.spyOn(stakeService['nodeService'], 'getAllNodes').mockResolvedValue(nodesMock);

      const result = await stakeService.getValidators();

      expect(result.totalValidators).toEqual(98);
      expect(result.activeValidators).toEqual(97);
      expect(result.queueSize).toEqual(parseInt(Buffer.from(queueSize, 'base64').toString()));
    });
  });

  describe('getMinimumAuctionTopUp', () => {
    it('should return undefined when there are no auctions', () => {
      const response = { auctionList: [] };
      jest.spyOn(gatewayService, 'getValidatorAuctions').mockResolvedValue(response.auctionList);

      const minimumAuctionTopUp = stakeService.getMinimumAuctionTopUp([]);

      expect(minimumAuctionTopUp).toBeUndefined();
    });

    it('should return "0" when all qualifiedTopUp are zero', () => {
      const response = {
        auctionList: [
          {
            qualifiedTopUp: '0',
            owner: "erd1netql0lyhcyd8ugpcfrchr60273rjemr5thug9g0fgxqa9ep5yeqvj7qfv",
            numStakedNodes: 1,
            totalTopUp: "0",
            topUpPerNode: "0",
            nodes: [
              {
                blsKey: "bc832a1c856963abd94b3bc28ce25473a47078e0a397fd2aad7e1c853352e5c8b6926075e31d0ca8fefcadeb652f3005aca644cf62d11c4a679aed8c9eb4c0d91bd2135a9af3ed285afd2a44c4d4e8741600b4ac8431681530bb018d251dac99",
                qualified: true,
              },
            ],
          },
          {
            qualifiedTopUp: '0',
            owner: "erd1crmrdw7dgkcmj6a045yjcq3ehvzyntegtn6pu9ttnl35l9kcmjjqsf5v59",
            numStakedNodes: 1,
            totalTopUp: "0",
            topUpPerNode: "0",
            nodes: [
              {
                blsKey: "a5e971635917fd89c76f7967a1d2a5d83e18219126f85933b46ac7af3afba8a3d46479bf151b7e56c4379c3b9d756e0161e2d59bfbb4a7b9b33dfa7952735132a350fb32ab38dacbed85ca8f0d5ccf046a8e68eff2cddf5fe317a34ec8dee40e",
                qualified: true,
              },
            ],
          },
        ],
      };
      jest.spyOn(gatewayService, 'getValidatorAuctions').mockResolvedValue(response.auctionList);

      const minimumAuctionTopUp = stakeService.getMinimumAuctionTopUp(response.auctionList);

      expect(minimumAuctionTopUp).toStrictEqual("0");
    });

    it('should return the smallest positive qualifiedTopUp', () => {
      const response = {
        auctionList: [
          {
            qualifiedTopUp: '2400000000000000000000',
            owner: "erd1netql0lyhcyd8ugpcfrchr60273rjemr5thug9g0fgxqa9ep5yeqvj7qfv",
            numStakedNodes: 1,
            totalTopUp: "0",
            topUpPerNode: "0",
            nodes: [
              {
                blsKey: "bc832a1c856963abd94b3bc28ce25473a47078e0a397fd2aad7e1c853352e5c8b6926075e31d0ca8fefcadeb652f3005aca644cf62d11c4a679aed8c9eb4c0d91bd2135a9af3ed285afd2a44c4d4e8741600b4ac8431681530bb018d251dac99",
                qualified: true,
              },
            ],
          },
          {
            qualifiedTopUp: '2300000000000000000000',
            owner: "erd1crmrdw7dgkcmj6a045yjcq3ehvzyntegtn6pu9ttnl35l9kcmjjqsf5v59",
            numStakedNodes: 1,
            totalTopUp: "0",
            topUpPerNode: "0",
            nodes: [
              {
                blsKey: "a5e971635917fd89c76f7967a1d2a5d83e18219126f85933b46ac7af3afba8a3d46479bf151b7e56c4379c3b9d756e0161e2d59bfbb4a7b9b33dfa7952735132a350fb32ab38dacbed85ca8f0d5ccf046a8e68eff2cddf5fe317a34ec8dee40e",
                qualified: true,
              },
            ],
          },
        ],
      };
      jest.spyOn(gatewayService, 'getValidatorAuctions').mockResolvedValue(response.auctionList);

      const minimumAuctionTopUp = stakeService.getMinimumAuctionTopUp(response.auctionList);

      expect(minimumAuctionTopUp).toEqual('2300000000000000000000');
    });

    it('should only consider qualified nodes', () => {
      const response = {
        auctionList: [
          {
            qualifiedTopUp: '3000000000000000000000',
            owner: "erd1netql0lyhcyd8ugpcfrchr60273rjemr5thug9g0fgxqa9ep5yeqvj7qfv",
            numStakedNodes: 1,
            totalTopUp: "0",
            topUpPerNode: "0",
            nodes: [
              {
                blsKey: "bc832a1c856963abd94b3bc28ce25473a47078e0a397fd2aad7e1c853352e5c8b6926075e31d0ca8fefcadeb652f3005aca644cf62d11c4a679aed8c9eb4c0d91bd2135a9af3ed285afd2a44c4d4e8741600b4ac8431681530bb018d251dac99",
                qualified: true,
              },
            ],
          },
          {
            qualifiedTopUp: '2500000000000000000000',
            owner: "erd1crmrdw7dgkcmj6a045yjcq3ehvzyntegtn6pu9ttnl35l9kcmjjqsf5v59",
            numStakedNodes: 1,
            totalTopUp: "0",
            topUpPerNode: "0",
            nodes: [
              {
                blsKey: "a5e971635917fd89c76f7967a1d2a5d83e18219126f85933b46ac7af3afba8a3d46479bf151b7e56c4379c3b9d756e0161e2d59bfbb4a7b9b33dfa7952735132a350fb32ab38dacbed85ca8f0d5ccf046a8e68eff2cddf5fe317a34ec8dee40e",
                qualified: false,
              },
            ],
          },
        ],
      };
      jest.spyOn(gatewayService, 'getValidatorAuctions').mockResolvedValue(response.auctionList);

      const minimumAuctionTopUp = stakeService.getMinimumAuctionTopUp(response.auctionList);

      expect(minimumAuctionTopUp).toEqual('3000000000000000000000');
    });

    it('should correctly calculate minimum auction topup even if values come sorted wrongly', () => {
      const response = {
        auctionList: [
          {
            qualifiedTopUp: '2500000000000000000000',
            owner: "erd1netql0lyhcyd8ugpcfrchr60273rjemr5thug9g0fgxqa9ep5yeqvj7qfv",
            numStakedNodes: 1,
            totalTopUp: "0",
            topUpPerNode: "0",
            nodes: [
              {
                blsKey: "bc832a1c856963abd94b3bc28ce25473a47078e0a397fd2aad7e1c853352e5c8b6926075e31d0ca8fefcadeb652f3005aca644cf62d11c4a679aed8c9eb4c0d91bd2135a9af3ed285afd2a44c4d4e8741600b4ac8431681530bb018d251dac99",
                qualified: true,
              },
            ],
          },
          {
            qualifiedTopUp: '3000000000000000000000',
            owner: "erd1crmrdw7dgkcmj6a045yjcq3ehvzyntegtn6pu9ttnl35l9kcmjjqsf5v59",
            numStakedNodes: 1,
            totalTopUp: "0",
            topUpPerNode: "0",
            nodes: [
              {
                blsKey: "a5e971635917fd89c76f7967a1d2a5d83e18219126f85933b46ac7af3afba8a3d46479bf151b7e56c4379c3b9d756e0161e2d59bfbb4a7b9b33dfa7952735132a350fb32ab38dacbed85ca8f0d5ccf046a8e68eff2cddf5fe317a34ec8dee40e",
                qualified: false,
              },
            ],
          },
        ],
      };
      jest.spyOn(gatewayService, 'getValidatorAuctions').mockResolvedValue(response.auctionList);

      const minimumAuctionTopUp = stakeService.getMinimumAuctionTopUp(response.auctionList);

      expect(minimumAuctionTopUp).toEqual('2500000000000000000000');
    });

    it('Should return correctly minimum auction topup if all values are selected', () => {
      const response = {
        auctionList: [
          {
            qualifiedTopUp: '2500000000000000000000',
            owner: "erd1netql0lyhcyd8ugpcfrchr60273rjemr5thug9g0fgxqa9ep5yeqvj7qfv",
            numStakedNodes: 1,
            totalTopUp: "0",
            topUpPerNode: "0",
            nodes: [
              {
                blsKey: "bc832a1c856963abd94b3bc28ce25473a47078e0a397fd2aad7e1c853352e5c8b6926075e31d0ca8fefcadeb652f3005aca644cf62d11c4a679aed8c9eb4c0d91bd2135a9af3ed285afd2a44c4d4e8741600b4ac8431681530bb018d251dac99",
                qualified: true,
              },
            ],
          },
          {
            qualifiedTopUp: '3000000000000000000000',
            owner: "erd1crmrdw7dgkcmj6a045yjcq3ehvzyntegtn6pu9ttnl35l9kcmjjqsf5v59",
            numStakedNodes: 1,
            totalTopUp: "0",
            topUpPerNode: "0",
            nodes: [
              {
                blsKey: "a5e971635917fd89c76f7967a1d2a5d83e18219126f85933b46ac7af3afba8a3d46479bf151b7e56c4379c3b9d756e0161e2d59bfbb4a7b9b33dfa7952735132a350fb32ab38dacbed85ca8f0d5ccf046a8e68eff2cddf5fe317a34ec8dee40e",
                qualified: false,
              },
            ],
          },
          {
            qualifiedTopUp: '2300000000000000000000',
            owner: "erd1crmrdw7dgkcmj6a045yjcq3ehvzyntegtn6pu9ttnl35l9kcmjjqsf5v59",
            numStakedNodes: 1,
            totalTopUp: "0",
            topUpPerNode: "0",
            nodes: [
              {
                blsKey: "a5e971635917fd89c76f7967a1d2a5d83e18219126f85933b46ac7af3afba8a3d46479bf151b7e56c4379c3b9d756e0161e2d59bfbb4a7b9b33dfa7952735132a350fb32ab38dacbed85ca8f0d5ccf046a8e68eff2cddf5fe317a34ec8dee40e",
                qualified: false,
              },
            ],
          },
        ],
      };
      jest.spyOn(gatewayService, 'getValidatorAuctions').mockResolvedValue(response.auctionList);

      const minimumAuctionTopUp = stakeService.getMinimumAuctionTopUp(response.auctionList);

      expect(minimumAuctionTopUp).toEqual('2500000000000000000000');
    });
  });

  describe('getMinimumAuctionStake', () => {
    it('should return 2500 when getMinimumAuctionTopUp is undefined', () => {
      jest.spyOn(stakeService, 'getMinimumAuctionTopUp').mockReturnValue('');

      const result = stakeService.getMinimumAuctionStake([]);

      expect(result).toEqual('2500000000000000000000');
    });

    it('should return the sum of 2500 and a positive minimum auction top up', () => {
      const response = {
        auctionList: [
          {
            qualifiedTopUp: '2500000000000000000000',
            owner: "erd1netql0lyhcyd8ugpcfrchr60273rjemr5thug9g0fgxqa9ep5yeqvj7qfv",
            numStakedNodes: 1,
            totalTopUp: "0",
            topUpPerNode: "0",
            nodes: [
              {
                blsKey: "bc832a1c856963abd94b3bc28ce25473a47078e0a397fd2aad7e1c853352e5c8b6926075e31d0ca8fefcadeb652f3005aca644cf62d11c4a679aed8c9eb4c0d91bd2135a9af3ed285afd2a44c4d4e8741600b4ac8431681530bb018d251dac99",
                qualified: true,
              },
            ],
          },
          {
            qualifiedTopUp: '3000000000000000000000',
            owner: "erd1crmrdw7dgkcmj6a045yjcq3ehvzyntegtn6pu9ttnl35l9kcmjjqsf5v59",
            numStakedNodes: 1,
            totalTopUp: "0",
            topUpPerNode: "0",
            nodes: [
              {
                blsKey: "a5e971635917fd89c76f7967a1d2a5d83e18219126f85933b46ac7af3afba8a3d46479bf151b7e56c4379c3b9d756e0161e2d59bfbb4a7b9b33dfa7952735132a350fb32ab38dacbed85ca8f0d5ccf046a8e68eff2cddf5fe317a34ec8dee40e",
                qualified: false,
              },
            ],
          },
          {
            qualifiedTopUp: '2300000000000000000000',
            owner: "erd1crmrdw7dgkcmj6a045yjcq3ehvzyntegtn6pu9ttnl35l9kcmjjqsf5v59",
            numStakedNodes: 1,
            totalTopUp: "0",
            topUpPerNode: "0",
            nodes: [
              {
                blsKey: "a5e971635917fd89c76f7967a1d2a5d83e18219126f85933b46ac7af3afba8a3d46479bf151b7e56c4379c3b9d756e0161e2d59bfbb4a7b9b33dfa7952735132a350fb32ab38dacbed85ca8f0d5ccf046a8e68eff2cddf5fe317a34ec8dee40e",
                qualified: false,
              },
            ],
          },
        ],
      };
      jest.spyOn(stakeService, 'getMinimumAuctionTopUp').mockReturnValue('500');

      const result = stakeService.getMinimumAuctionStake(response.auctionList);

      expect(result).toEqual('2500000000000000000500');
    });

    it('should correctly handle large minimum auction top up values', () => {
      const response = {
        auctionList: [
          {
            qualifiedTopUp: '2500000000000000000000',
            owner: "erd1netql0lyhcyd8ugpcfrchr60273rjemr5thug9g0fgxqa9ep5yeqvj7qfv",
            numStakedNodes: 1,
            totalTopUp: "0",
            topUpPerNode: "0",
            nodes: [
              {
                blsKey: "bc832a1c856963abd94b3bc28ce25473a47078e0a397fd2aad7e1c853352e5c8b6926075e31d0ca8fefcadeb652f3005aca644cf62d11c4a679aed8c9eb4c0d91bd2135a9af3ed285afd2a44c4d4e8741600b4ac8431681530bb018d251dac99",
                qualified: true,
              },
            ],
          },
          {
            qualifiedTopUp: '3000000000000000000000',
            owner: "erd1crmrdw7dgkcmj6a045yjcq3ehvzyntegtn6pu9ttnl35l9kcmjjqsf5v59",
            numStakedNodes: 1,
            totalTopUp: "0",
            topUpPerNode: "0",
            nodes: [
              {
                blsKey: "a5e971635917fd89c76f7967a1d2a5d83e18219126f85933b46ac7af3afba8a3d46479bf151b7e56c4379c3b9d756e0161e2d59bfbb4a7b9b33dfa7952735132a350fb32ab38dacbed85ca8f0d5ccf046a8e68eff2cddf5fe317a34ec8dee40e",
                qualified: false,
              },
            ],
          },
          {
            qualifiedTopUp: '2300000000000000000000',
            owner: "erd1crmrdw7dgkcmj6a045yjcq3ehvzyntegtn6pu9ttnl35l9kcmjjqsf5v59",
            numStakedNodes: 1,
            totalTopUp: "0",
            topUpPerNode: "0",
            nodes: [
              {
                blsKey: "a5e971635917fd89c76f7967a1d2a5d83e18219126f85933b46ac7af3afba8a3d46479bf151b7e56c4379c3b9d756e0161e2d59bfbb4a7b9b33dfa7952735132a350fb32ab38dacbed85ca8f0d5ccf046a8e68eff2cddf5fe317a34ec8dee40e",
                qualified: false,
              },
            ],
          },
        ],
      };
      jest.spyOn(stakeService, 'getMinimumAuctionTopUp').mockReturnValue('1000000');

      const result = stakeService.getMinimumAuctionStake(response.auctionList);

      expect(result).toEqual('2500000000000001000000');
    });
  });

  describe('getNakamotoCoefficient', () => {
    it('should correctly calculate Nakamoto Coefficient', async () => {
      const data = JSON.parse(fs.readFileSync(path.join(__dirname, '../../mocks/identities.mock.json'), 'utf-8'));
      jest.spyOn(identitiesService, 'getAllIdentities').mockResolvedValue(data);

      const mockedValidators = {
        totalValidators: 3200,
        activeValidators: 3100,
        inactiveValidators: 0,
        queueSize: 100,
      };
      jest.spyOn(stakeService, 'getValidators').mockResolvedValue(mockedValidators);

      const nakamotoCoefficient = await stakeService.getNakamotoCoefficient();

      expect(nakamotoCoefficient).toStrictEqual(4);
    });
  });
});
