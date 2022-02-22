import { CachingService } from 'src/common/caching/caching.service';
import Initializer from "./e2e-init";
import { Test } from "@nestjs/testing";
import { PublicAppModule } from "../../public.app.module";
import { Constants } from "../../utils/constants";
import { ProtocolService } from "../../common/protocol/protocol.service";

describe('Protocol Service', () => {
  let protocolService: ProtocolService;

  beforeAll(async () => {
    await Initializer.initialize();
    const publicAppModule = await Test.createTestingModule({
      imports: [PublicAppModule],
    }).compile();

    protocolService = publicAppModule.get<ProtocolService>(ProtocolService);

  }, Constants.oneHour() * 1000);

  beforeEach(() => { jest.restoreAllMocks(); });

  describe('Get Shards Ids', () => {
    it('should return shards ids', async () => {
      jest
        .spyOn(CachingService.prototype, 'getOrSetCache')
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
