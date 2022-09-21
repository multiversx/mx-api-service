import { INestApplication } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { PublicAppModule } from "src/public.app.module";
import request = require('supertest');

describe('Blocks', () => {
  let app: INestApplication;
  const gql = '/graphql';

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [PublicAppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  describe('Query - Get Blocks', () => {
    it('should returns a list of all blocks from all shards', async () => {
      await request(app.getHttpServer())
        .post(gql)
        .send({
          query: `{
            blocks(input:{
            }){
              hash
              epoch
              nonce
              prevHash
              proposer
              pubKeyBitmap
              round
              shard
              size
              sizeTxs
              stateRootHash
              timestamp
              txCount
              gasConsumed
              gasRefunded
              gasPenalized
              maxGasLimit
            }
          }`,
        })
        .expect(200)
        .then(res => {
          expect(res.body.data.blocks).toBeDefined();
        });
    });

    it('should returns a list of all blocks from shard 2 and epoch 79 and nonce 1151901', async () => {
      const blocksFilter = {
        shard: 2,
        epoch: 79,
        nonce: 1151901,
      };
      await request(app.getHttpServer())
        .post(gql)
        .send({
          query: `{
            blocks(input:{
              shard: ${blocksFilter.shard}, epoch: ${blocksFilter.epoch}, nonce: ${blocksFilter.nonce}
            }){
              hash
              epoch
              nonce
              prevHash
              proposer
              pubKeyBitmap
              round
              shard
              size
              sizeTxs
              stateRootHash
              timestamp
              txCount
              gasConsumed
              gasRefunded
              gasPenalized
              maxGasLimit
            }
          }`,
        })
        .expect(200)
        .then(res => {
          expect(res.body.data.blocks).toBeDefined();
          expect(res.body.data.blocks[0].epoch).toStrictEqual(79);
          expect(res.body.data.blocks[0].nonce).toStrictEqual(1151901);
          expect(res.body.data.blocks[0].shard).toStrictEqual(2);
        });
    });
  });

  afterEach(async () => {
    await app.close();
  });
});
