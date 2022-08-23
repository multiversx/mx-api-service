import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PublicAppModule } from 'src/public.app.module';
import request = require('supertest');

describe("Results Controller", () => {
  let app: INestApplication;
  const path: string = "/results";

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [PublicAppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  describe('results', () => {
    it('should return 25 smart contract results', async () => {
      await request(app.getHttpServer())
        .get(`${path}`)
        .expect(200)
        .then(res => {
          expect(res.body).toHaveLength(25);
        });
    });

    it('should return one smart contract result details', async () => {
      const params = new URLSearchParams({
        'size': '1',
      });

      await request(app.getHttpServer())
        .get(`${path}?${params}`)
        .expect(200)
        .then(res => {
          expect(res.body).toHaveLength(1);
          expect(res.body[0].hash).toBeDefined();
          expect(res.body[0].timestamp).toBeDefined();
          expect(res.body[0].nonce).toBeDefined();
          expect(res.body[0].gasLimit).toBeDefined();
          expect(res.body[0].gasPrice).toBeDefined();
          expect(res.body[0].value).toBeDefined();
          expect(res.body[0].sender).toBeDefined();
          expect(res.body[0].receiver).toBeDefined();
          expect(res.body[0].data).toBeDefined();
          expect(res.body[0].prevTxHash).toBeDefined();
          expect(res.body[0].originalTxHash).toBeDefined();
          expect(res.body[0].callType).toBeDefined();
        });
    });

    it('should return one smart contract result details for a given miniBlockHash', async () => {
      const params = new URLSearchParams({
        'originalTxHashes': 'f01660479c8481a1c07e78508898130e45dc8657bf2fc5c2f377623eb18f734d',
      });

      await request(app.getHttpServer())
        .get(`${path}?${params}`)
        .expect(200)
        .then(res => {
          expect(res.body).toHaveLength(2);
          expect(res.body[0].hash).toStrictEqual('bc68da1de1926031f03211dc1610b4513043ccd497fdc09817aa721e20555057');
          expect(res.body[1].hash).toStrictEqual('6410188f7c240e795e1a0fc9c4656e406bae57721b4a685a49cfa73ae855d7d4');
        });
    });
  });

  describe('/results/count', () => {
    it('should return total number of smart contracts results', async () => {
      await request(app.getHttpServer())
        .get(`${path}/count`)
        .expect(200)
        .then(res => {
          expect(+res.text).toBeGreaterThanOrEqual(18100199);
        });
    });
  });

  describe('/results/{scHash}', () => {
    it('shoult return smart contract details for a given hash', async () => {
      const scHash: string = 'bc68da1de1926031f03211dc1610b4513043ccd497fdc09817aa721e20555057';
      await request(app.getHttpServer())
        .get(`${path}/${scHash}`)
        .expect(200)
        .then(res => {
          expect(res.body.hash).toStrictEqual('bc68da1de1926031f03211dc1610b4513043ccd497fdc09817aa721e20555057');
          expect(res.body.timestamp).toStrictEqual(1638181584);
          expect(res.body.nonce).toStrictEqual(80);
          expect(res.body.gasLimit).toStrictEqual(0);
          expect(res.body.gasPrice).toStrictEqual(1000000000);
          expect(res.body.value).toStrictEqual('18887450000000');
          expect(res.body.sender).toStrictEqual('erd1qqqqqqqqqqqqqpgqvc7gdl0p4s97guh498wgz75k8sav6sjfjlwqh679jy');
          expect(res.body.receiver).toStrictEqual('erd1005j3q6tlfcpsqcsw3pe5v5ag5xtfckje3ckkm6h4ef92epjzywq9nqqc3');
          expect(res.body.data).toStrictEqual('QDZmNmI=');
          expect(res.body.prevTxHash).toStrictEqual('f01660479c8481a1c07e78508898130e45dc8657bf2fc5c2f377623eb18f734d');
          expect(res.body.originalTxHash).toStrictEqual('f01660479c8481a1c07e78508898130e45dc8657bf2fc5c2f377623eb18f734d');
          expect(res.body.callType).toStrictEqual('0');
        });
    });
  });

  describe('Validations', () => {
    it('should return 400 Bad Request if given scHash is not a valid transaction hash', async () => {
      const scHash: string = 'bc68da1de1926031f03211dc1610b4513043ccd497fdc09817aa721es20555057';

      await request(app.getHttpServer())
        .get(`${path}/${scHash}`)
        .expect(400)
        .then(res => {
          expect(res.body.message).toContain('Validation failed');
        });
    });

    it('should return 404 Not Found', async () => {
      const scHash: string = 'bc68da1de1926031f03211dc1610b4513043ccd497fdc09817aa721e2055505T';

      await request(app.getHttpServer())
        .get(`${path}/${scHash}`)
        .expect(404)
        .then(res => {
          expect(res.body.message).toStrictEqual("Smart contract result not found");
        });
    });
  });

  afterEach(async () => {
    await app.close();
  });
});
