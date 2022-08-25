import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PublicAppModule } from 'src/public.app.module';
import request = require('supertest');

describe("Block Controller", () => {
  let app: INestApplication;
  const path: string = "/blocks";

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [PublicAppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  describe('/blocks', () => {
    it('should return 25 blocks details from all shards', async () => {
      await request(app.getHttpServer())
        .get(`${path}`)
        .expect(200)
        .then(res => {
          expect(res.body).toHaveLength(25);
        });
    });

    it('should return 1 block details', async () => {
      const params = new URLSearchParams({
        'size': '1',
      });

      await request(app.getHttpServer())
        .get(`${path}?${params}`)
        .expect(200)
        .then(res => {
          expect(res.body).toHaveLength(1);
        });
    });

    test.each`
    shard
    ${1}
    ${2}
    ${0}
    ${4294967295}
    `
      (
        `should return 25 blocks from shard $shard`,
        async ({ shard }) => {
          const params = new URLSearchParams({
            'shard': shard,
          });

          await request(app.getHttpServer())
            .get(`${path}?${params}`)
            .expect(200)
            .then(res => {
              expect(res.body).toHaveLength(25);
              expect(res.body[0].shard).toStrictEqual(parseInt(`${shard}`));
            });
        }
      );
  });

  describe('/blocks/count', () => {
    it('should return count of all blocks from all shards', async () => {
      await request(app.getHttpServer())
        .get(`${path}/count`)
        .expect(200)
        .then(res => {
          expect(+res.text).toBeGreaterThanOrEqual(42605100);
        });
    });

    [
      {
        shard: 1,
        count: 10652302,
      },
      {
        shard: 0,
        count: 10656418,
      },
      {
        shard: 4294967295,
        count: 10640421,
      },
      {
        shard: 2,
        count: 10656826,
      },
    ].forEach(({ shard, count }) => {
      describe(`shard = ${shard}`, () => {
        it(`shoudl return count of all blocks from shard ${shard}`, async () => {
          const params = new URLSearchParams({
            'shard': `${shard}`,
          });

          await request(app.getHttpServer())
            .get(`${path}/count?${params}`)
            .expect(200)
            .then(res => {
              expect(+res.text).toBeGreaterThanOrEqual(count);
            });
        });
      });
    });
  });

  describe('/blocks/{hash}', () => {
    it('should return block information details for a given hash', async () => {
      const hash: string = 'c3cd456e15a59bb1f143eefd4986ef010965047f89e303b80822b05177351ccd';

      await request(app.getHttpServer())
        .get(`${path}/${hash}`)
        .expect(200)
        .then(res => {
          expect(res.body.hash).toStrictEqual(hash);
          expect(res.body.epoch).toStrictEqual(500);
          expect(res.body.nonce).toStrictEqual(7212812);
          expect(res.body.prevHash).toStrictEqual('be95ddc0f2a38f1732c5fba296ea340a92dff62cab74ac710b5395cc3a1d349d');
          expect(res.body.proposer).toStrictEqual('7e97327bac868aba21777a1fd336e260d1dfb3357d7e117a3ce6d4c2e9869ceed756eb094042dd961f1c0e9c47612f0986fb15b39847688fdf90b02fb13ff700ee3ce0b31738942e447fd0f40c77b7d0ae974c03a364a67dad0cd9ec039f3b09');
          expect(res.body.pubKeyBitmap).toStrictEqual('ffffffffffffff7f');
          expect(res.body.round).toStrictEqual(7214879);
          expect(res.body.shard).toStrictEqual(1);
          expect(res.body.size).toStrictEqual(2095);
          expect(res.body.sizeTxs).toStrictEqual(31137);
          expect(res.body.stateRootHash).toStrictEqual('623b558cb2f057e0a1e90e748373f5739893dadeeab8ae7bdd4fa092bf5635a0');
          expect(res.body.timestamp).toStrictEqual(1639406874);
          expect(res.body.txCount).toStrictEqual(39);
          expect(res.body.gasConsumed).toStrictEqual(492435900);
          expect(res.body.gasRefunded).toStrictEqual(190541397);
          expect(res.body.gasPenalized).toStrictEqual(0);
          expect(res.body.maxGasLimit).toStrictEqual(1500000000);
          expect(res.body.miniBlocksHashes).toBeDefined();
          expect(res.body.validators).toBeDefined();
        });
    });
  });

  describe('Validations', () => {
    it('should return 400 Bad Request for a invalid block hash', async () => {
      const hash: string = 'c3cd456e15a59bb1f143eefd4986ef010965047f89e303b80822b05177351c';

      await request(app.getHttpServer())
        .get(`${path}/${hash}`)
        .expect(400)
        .then(res => {
          expect(res.body.message).toContain("Validation failed");
        });
    });
  });

  afterEach(async () => {
    await app.close();
  });
});
