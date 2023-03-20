import { Test } from "@nestjs/testing";
import { ProtocolModule } from "src/common/protocol/protocol.module";
import { ElrondCachingService } from "@multiversx/sdk-nestjs";
import { ProtocolService } from "src/common/protocol/protocol.service";
import { EventEmitterModule } from "@nestjs/event-emitter";

describe('Protocol Service', () => {
  let protocolService: ProtocolService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [EventEmitterModule.forRoot(), ProtocolModule],
      providers: [],
    }).compile();

    protocolService = moduleRef.get<ProtocolService>(ProtocolService);
  });

  beforeEach(() => { jest.restoreAllMocks(); });

  describe('Get Shards Ids', () => {
    it('should return shards ids', async () => {
      jest
        .spyOn(ElrondCachingService.prototype, 'getOrSet')
        .mockImplementation(jest.fn((_key: string, promise: any) => promise()));

      const shardsId = await protocolService.getShardIds();
      expect(shardsId).toStrictEqual([0, 1, 2, 4294967295]);
    });
  });

  describe('Get Seconds Remaining Until Next Round', () => {
    it('should return the remaining seconds until next round', async () => {
      const returnedSeconds = await protocolService.getSecondsRemainingUntilNextRound();
      expect(typeof returnedSeconds).toBe('number');
    });
  });
});
