import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PublicAppModule } from 'src/public.app.module';
import request = require('supertest');

describe("Delegations Controller", () => {
  let app: INestApplication;
  const delegationPath: string = "/delegation";
  const delegationLegacyPath: string = "/delegation-legacy";

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [PublicAppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  describe('/delegation', () => {
    it('should return delegation staking contract information', async () => {
      await request(app.getHttpServer())
        .get(`${delegationPath}`)
        .expect(200)
        .then(res => {
          expect(res.body.stake).toBeDefined();
          expect(res.body.topUp).toBeDefined();
          expect(res.body.locked).toBeDefined();
          expect(res.body.minDelegation).toBeDefined();
        });
    });
  });

  describe('/delegation-legacy', () => {
    it('should return legacy delegation contract global information', async () => {
      await request(app.getHttpServer())
        .get(`${delegationLegacyPath}`)
        .expect(200)
        .then(res => {
          expect(res.body.totalWithdrawOnlyStake).toBeDefined();
          expect(res.body.totalWaitingStake).toBeDefined();
          expect(res.body.totalActiveStake).toBeDefined();
          expect(res.body.totalUnstakedStake).toBeDefined();
          expect(res.body.totalDeferredPaymentStake).toBeDefined();
          expect(res.body.numUsers).toBeDefined();
        });
    });
  });

  afterEach(async () => {
    await app.close();
  });
});
