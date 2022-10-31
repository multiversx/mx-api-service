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

  describe('Query - Get Block', () => {
    it('should returns block information details for a given hash.', async () => {
      const blockHash = {
        hash: `"a7edf0f43819fb6205c77a04f65d9e301f6d7bf1c44fc0e6e1225a401fee5011"`,
      };
      await request(app.getHttpServer())
        .post(gql)
        .send({
          query: `{
            blockHash(input:{
              hash: ${blockHash.hash}
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
              validators
            }
          }`,
        })
        .expect(200)
        .then(res => {
          expect(res.body.data.blockHash).toBeDefined();
          expect(res.body.data.blockHash.hash).toStrictEqual('a7edf0f43819fb6205c77a04f65d9e301f6d7bf1c44fc0e6e1225a401fee5011');
        });
    });
  });

  describe('Query - Get Blocks Count', () => {
    [
      {
        filter: 'shard',
        value: 2,
        count: 1069686,
      },
      {
        filter: 'epoch',
        value: 79,
        count: 57571,
      },
      {
        filter: 'proposer',
        value: `"11f3b1f7aba458061ba7bdc51291494ef0555016c121de5ed1c2ef464487ca3fe263e11a0762d524c10d1c82dd72490c143956ad48a419f26cc65cfff154a7a32cd4d89b06bf5d39700717485fa6a65cf2443257bb1676b38e5323b7b0435892"`,
        count: 957032,
      },
      {
        filter: 'nonce',
        value: 1151901,
        count: 2,
      },
    ].forEach(({ filter, value, count }) => {
      describe(`filter = ${filter}`, () => {
        it(`should return total count based on ${filter} filter with value ${value}`, async () => {
          await request(app.getHttpServer())
            .post(gql)
            .send({
              query: `{
                blocksCount(input:{
                 ${filter}: ${value}
                })
              }`,
            })
            .expect(200)
            .then(res => {
              expect(res.body.data.blocksCount).toBeGreaterThanOrEqual(count);
            });
        });
      });
    });
  });

  afterEach(async () => {
    await app.close();
  });
});
