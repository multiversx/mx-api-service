import { Test } from "@nestjs/testing";
import { Round } from "src/endpoints/rounds/entities/round";
import { RoundFilter } from "src/endpoints/rounds/entities/round.filter";
import { RoundService } from "src/endpoints/rounds/round.service";
import { PublicAppModule } from "src/public.app.module";
import { RoundDetailed } from "../../endpoints/rounds/entities/round.detailed";
import '@elrondnetwork/erdnest/lib/src/utils/extensions/jest.extensions';

describe('Rounds Service', () => {
  let roundService: RoundService;
  let rounds: Round[];

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [PublicAppModule],
    }).compile();

    roundService = moduleRef.get<RoundService>(RoundService);
    rounds = await roundService.getRounds(new RoundFilter());
  });

  describe('Rounds', () => {
    it('all entities should have round structure', () => {
      for (const round of rounds) {
        expect(round).toHaveStructure(Object.keys(new Round()));
      }
    });

    it('should be filtered by shard and epoch', async () => {
      const roundFilter = new RoundFilter();
      roundFilter.shard = 2;
      roundFilter.epoch = 402;

      const results = await roundService.getRounds(roundFilter);
      for (const result of results) {
        expect(result.shard).toStrictEqual(roundFilter.shard);
      }
    });

    it("should be filtered by validator", async () => {
      const roundFilter = new RoundFilter();
      roundFilter.validator = "00f9b676245ecf7bc74e3b644c106cfbbb366ce01a0149c1e50303d22c09bef7600f21f1925753ab994174b9926e9b078c2d1edaf03c221149ea0239722278aa864a1b26f298c29fe546fdb0ee1385243dfe407074e0dfa134c7e6d4197ce110";

      const results = await roundService.getRounds(roundFilter);
      for (const result of results) {
        expect(result).toHaveStructure(Object.keys(new Round()));
      }
    });
  });

  describe('Get Round Count', () => {
    it('should return round count based on filter', async () => {
      const result = await roundService.getRoundCount(new RoundFilter());
      expect(typeof result).toStrictEqual('number');
    });

    it("should return rounds count based on validator filter", async () => {
      const filter = new RoundFilter();
      filter.validator = "00f9b676245ecf7bc74e3b644c106cfbbb366ce01a0149c1e50303d22c09bef7600f21f1925753ab994174b9926e9b078c2d1edaf03c221149ea0239722278aa864a1b26f298c29fe546fdb0ee1385243dfe407074e0dfa134c7e6d4197ce110";

      const result = await roundService.getRoundCount(filter);
      expect(typeof result).toStrictEqual('number');
    });

    it("should return rounds count based on pagination filter filter", async () => {
      const filter = new RoundFilter();
      filter.from = 0;
      filter.size = 1;

      const result = await roundService.getRoundCount(filter);
      expect(typeof result).toStrictEqual('number');
    });

    it("should return rounds count based on epoch and shard 1 filter", async () => {
      const filter = new RoundFilter();
      filter.shard = 1;
      filter.epoch = 401;

      const result = await roundService.getRoundCount(filter);
      expect(typeof result).toStrictEqual('number');
    });

    it("should return rounds count based on epoch and shard 2 filter", async () => {
      const filter = new RoundFilter();
      filter.shard = 2;
      filter.epoch = 402;

      const result = await roundService.getRoundCount(filter);
      expect(typeof result).toStrictEqual('number');
    });
  });

  describe('Get Round', () => {
    it('should return round details based on shard and round', async () => {
      const shard: number = 1;
      const round: number = 10;
      const result = await roundService.getRound(shard, round);

      expect(result).toHaveStructure(Object.keys(new RoundDetailed()));
    });
  });
});

