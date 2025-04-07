import { Test } from "@nestjs/testing";
import { Round } from "src/common/indexer/entities";
import { IndexerService } from "src/common/indexer/indexer.service";
import { BlsService } from "src/endpoints/bls/bls.service";
import { RoundDetailed } from "src/endpoints/rounds/entities/round.detailed";
import { RoundFilter } from "src/endpoints/rounds/entities/round.filter";
import { RoundService } from "src/endpoints/rounds/round.service";
import { ApiConfigService } from "../../../common/api-config/api.config.service";
import { BlockService } from "../../../endpoints/blocks/block.service";

describe('RoundService', () => {
  let roundService: RoundService;
  let indexerService: IndexerService;
  let blockService: BlockService;
  let apiConfigService: ApiConfigService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        RoundService,
        {
          provide: IndexerService,
          useValue: {
            getRoundCount: jest.fn(),
            getRounds: jest.fn(),
            getRound: jest.fn(),
          },
        },
        {
          provide: BlsService,
          useValue: {
            getPublicKeys: jest.fn(),
          },
        },
        {
          provide: ApiConfigService,
          useValue: {
            isChainAndromedaEnabled: jest.fn(),
            getChainAndromedaActivationEpoch: jest.fn(),
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

    roundService = moduleRef.get<RoundService>(RoundService);
    indexerService = moduleRef.get<IndexerService>(IndexerService);
    blockService = moduleRef.get<BlockService>(BlockService);
    apiConfigService = moduleRef.get<ApiConfigService>(ApiConfigService);
  });

  describe('getRoundCount', () => {
    it('should call indexerService.getRoundCount with the provided filter', async () => {
      const filter = new RoundFilter();
      filter.shard = 1;
      const expectedCount = 10;
      jest.spyOn(indexerService, 'getRoundCount').mockResolvedValue(expectedCount);

      const result = await roundService.getRoundCount(filter);

      expect(indexerService.getRoundCount).toHaveBeenCalledWith(filter);
      expect(result).toEqual(expectedCount);
    });
  });

  describe('getRounds', () => {
    it('should call indexerService.getRounds with the provided filter', async () => {
      const filter = new RoundFilter();
      filter.shard = 0;
      const indexerRoundsMock: Round[] = [
        {
          round: 1,
          signersIndexes: [],
          blockWasProposed: true,
          shardId: 0,
          epoch: 0,
          timestamp: 1596117606,
        },
        {
          round: 1,
          signersIndexes: [],
          blockWasProposed: true,
          shardId: 0,
          epoch: 0,
          timestamp: 1596117116,
        },
      ];

      const expectedRounds = [
        {
          round: 1,
          blockWasProposed: true,
          shard: 0,
          epoch: 0,
          timestamp: 1596117606,
        },
        {
          round: 1,
          blockWasProposed: true,
          shard: 0,
          epoch: 0,
          timestamp: 1596117116,
        },
      ];

      jest.spyOn(indexerService, 'getRounds').mockResolvedValue(indexerRoundsMock);

      const result = await roundService.getRounds(filter);

      expect(indexerService.getRounds).toHaveBeenCalledWith(filter);
      expect(result).toEqual(expectedRounds);
    });

    it('should remove validator filter if Andromeda is active', async () => {
      const filter = new RoundFilter();
      filter.shard = 0;
      filter.validator = 'should not exist';

      jest.spyOn(blockService, 'getCurrentEpoch').mockResolvedValue(10);
      jest.spyOn(apiConfigService, 'isChainAndromedaEnabled').mockReturnValue(true);
      jest.spyOn(apiConfigService, 'getChainAndromedaActivationEpoch').mockReturnValue(9);

      const indexerRoundsMock: Round[] = [
        {
          round: 1,
          signersIndexes: [],
          blockWasProposed: true,
          shardId: 0,
          epoch: 0,
          timestamp: 1596117606,
        },
        {
          round: 1,
          signersIndexes: [],
          blockWasProposed: true,
          shardId: 0,
          epoch: 0,
          timestamp: 1596117116,
        },
      ];
      jest.spyOn(indexerService, 'getRounds').mockResolvedValue(indexerRoundsMock);

      await roundService.getRounds(filter);

      expect(indexerService.getRounds).toHaveBeenCalledWith(new RoundFilter({ shard: 0, validator: undefined }));
    });

    it('should keep validator filter if Andromeda is active', async () => {
      const filter = new RoundFilter();
      filter.shard = 0;
      filter.validator = 'should exist';

      jest.spyOn(blockService, 'getCurrentEpoch').mockResolvedValue(10);
      jest.spyOn(apiConfigService, 'isChainAndromedaEnabled').mockReturnValue(true);
      jest.spyOn(apiConfigService, 'getChainAndromedaActivationEpoch').mockReturnValue(11);

      const indexerRoundsMock: Round[] = [
        {
          round: 1,
          signersIndexes: [],
          blockWasProposed: true,
          shardId: 0,
          epoch: 0,
          timestamp: 1596117606,
        },
        {
          round: 1,
          signersIndexes: [],
          blockWasProposed: true,
          shardId: 0,
          epoch: 0,
          timestamp: 1596117116,
        },
      ];
      jest.spyOn(indexerService, 'getRounds').mockResolvedValue(indexerRoundsMock);

      await roundService.getRounds(filter);

      expect(indexerService.getRounds).toHaveBeenCalledWith(new RoundFilter({ shard: 0, validator: 'should exist' }));
    });
  });

  describe('getRound', () => {
    it('should call indexerService.getRound with the provided shard and round', async () => {
      const shard = 0;
      const round = 10;
      const indexerRoundMock: Round = {
        round: 10,
        signersIndexes: [],
        blockWasProposed: true,
        shardId: 0,
        epoch: 0,
        timestamp: 1596117606,
      };

      const expectedRound: RoundDetailed =
        {
          round: 10,
          signers: [],
          blockWasProposed: true,
          shard: 0,
          epoch: 0,
          timestamp: 1596117606,
        };

      jest.spyOn(indexerService, 'getRound').mockResolvedValue(indexerRoundMock);

      const result = await roundService.getRound(shard, round);

      expect(indexerService.getRound).toHaveBeenCalledWith(shard, round);
      expect(result).toEqual(expectedRound);
    });
  });
});
