import { Test } from "@nestjs/testing";
import { Round } from "src/endpoints/rounds/entities/round";
import { RoundFilter } from "src/endpoints/rounds/entities/round.filter";
import { RoundService } from "src/endpoints/rounds/round.service";
import { PublicAppModule } from "src/public.app.module";
import { Constants } from "src/utils/constants";
import Initializer from "./e2e-init";

describe('Rounds Service', () => {
  let roundService: RoundService;
  let rounds: Round[];

  beforeAll(async () => {
    await Initializer.initialize();
  }, Constants.oneHour() * 1000);

  beforeEach(async () => {
    const publicAppModule = await Test.createTestingModule({
      imports: [PublicAppModule],
    }).compile();

    roundService = publicAppModule.get<RoundService>(RoundService);
    rounds = await roundService.getRounds(new RoundFilter());
  });

  describe('Rounds', () => {
    it('all rounds should have round and shard', async () => {
      for (let round of rounds) {
        expect(round).toHaveProperty('round');
        expect(round).toHaveProperty('shard');
        expect(round).not.toHaveProperty('shardId');
      }
    });
    
    it('all entities should have round structure', async () => {
      for (let round of rounds) {
        expect(round).toHaveStructure(Object.keys(new Round()));
      }
    });

    it('should be filtered by shard and epoch', async () => {
      const roundFilter = new RoundFilter();
      roundFilter.shard = 2;
      roundFilter.epoch = 402;

      const roundsFiltered = await roundService.getRounds(roundFilter);
      for (let round of roundsFiltered) {
        expect(round.shard).toStrictEqual(roundFilter.shard);
      }
    });
  });
});