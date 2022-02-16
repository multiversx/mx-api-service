import { Test } from "@nestjs/testing";
import { PublicAppModule } from "../../public.app.module";
import { ProtocolService } from "../../common/protocol/protocol.service";

describe('Protocol Service', () => {
  let protocolService: ProtocolService;

  beforeAll(async () => {

    const publicAppModule = await Test.createTestingModule({
      imports: [PublicAppModule],
    }).compile();

    protocolService = publicAppModule.get<ProtocolService>(ProtocolService);

  });

  describe('Get Shards Ids', () => {
    it('should return shards ids', async () => {
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
