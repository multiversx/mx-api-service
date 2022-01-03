import { Test } from "@nestjs/testing";
import { Shard } from "src/endpoints/shards/entities/shard";
import { ShardService } from "src/endpoints/shards/shard.service";
import { PublicAppModule } from "src/public.app.module";
import { Constants } from "src/utils/constants";
import Initializer from "./e2e-init";

describe('Shard Service', () => {
  let shardService: ShardService;
  let shards: Shard[];

  beforeAll(async () => {
    await Initializer.initialize();
  }, Constants.oneHour() * 1000);

  beforeEach(async () => {
    const publicAppModule = await Test.createTestingModule({
      imports: [PublicAppModule],
    }).compile();

    shardService = publicAppModule.get<ShardService>(ShardService);
    shards = await shardService.getAllShards();
  });

  describe('Shards', () => {
    it('all shards should have shard, validators and activeValidators', async () => {
      for (let shard of shards) {
        expect(shard).toHaveProperty('shard');
        expect(shard).toHaveProperty('validators');
        expect(shard).toHaveProperty('activeValidators');
      }
    });
    
    it('all entities should have shard structure', async () => {
      for (let shard of shards) {
        expect(shard).toHaveStructure(Object.keys(new Shard()));
      }
    });
    describe('Shards List', ()=>{
      describe('Get all shards',  ()=>{
        it('should return a list of shards', async ()=>{
          const shardList =  await shardService.getAllShards();
          expect(shardList).toBeInstanceOf(Array);
        })

      })
    })
  });
});