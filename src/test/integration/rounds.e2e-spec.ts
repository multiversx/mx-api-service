import { Test } from "@nestjs/testing";
import { Round } from "src/endpoints/rounds/entities/round";
import { RoundFilter } from "src/endpoints/rounds/entities/round.filter";
import { RoundService } from "src/endpoints/rounds/round.service";
import { PublicAppModule } from "src/public.app.module";
import { Constants } from "src/utils/constants";
import Initializer from "./e2e-init";
import {RoundDetailed} from "../../endpoints/rounds/entities/round.detailed";

describe('Rounds Service', () => {
  let roundService: RoundService;
  let rounds: Round[];

  beforeAll(async () => {
    await Initializer.initialize();
    const publicAppModule = await Test.createTestingModule({
      imports: [PublicAppModule],
    }).compile();

    roundService = publicAppModule.get<RoundService>(RoundService);
    rounds = await roundService.getRounds(new RoundFilter());
  }, Constants.oneHour() * 1000);

  describe('Rounds', () => {
    it('all rounds should have round and shard', async () => {
      for (const round of rounds) {
        expect(round).toHaveProperty('round');
        expect(round).toHaveProperty('shard');
        expect(round).not.toHaveProperty('shardId');
      }
    });

    it('all entities should have round structure', async () => {
      for (const round of rounds) {
        expect(round).toHaveStructure(Object.keys(new Round()));
      }
    });

    it('should be filtered by shard and epoch', async () => {
      const roundFilter = new RoundFilter();
      roundFilter.shard = 2;
      roundFilter.epoch = 402;

      const roundsFiltered = await roundService.getRounds(roundFilter);
      for (const round of roundsFiltered) {
        expect(round.shard).toStrictEqual(roundFilter.shard);
      }
    });
  });

  describe('Get Round Count', () => {
    it('should return round count based on filter', async () => {
      const countValue: Number = new Number (await roundService.getRoundCount(new RoundFilter()));
      expect(countValue).toBeInstanceOf(Number);
    });
  });

  describe('Get Round', () => {
    it('should return round with filers: shard and round', async () => {
      const roundValue = await roundService.getRound(1,10);
      expect(roundValue).toBeInstanceOf(Object);
    });

    it('verify if round contain signers ', async () => {
      const roundValue = await roundService.getRound(1,10);
      expect(roundValue).toHaveProperty('signers');
    });

    it('all entities should have roundDetailed structure', async () => {
      const roundValue = await roundService.getRound(1,10);
      expect(roundValue).toHaveStructure(Object.keys(new RoundDetailed()));
    });
  });
});