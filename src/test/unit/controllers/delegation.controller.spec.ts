import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request = require('supertest');
import { mockDelegationService } from "./services.mock/delegation.services.mock";
import { DelegationController } from "src/endpoints/delegation/delegation.controller";
import { DelegationModule } from "src/endpoints/delegation/delegation.module";
import { DelegationService } from "src/endpoints/delegation/delegation.service";

describe('DelegationController', () => {
  let app: INestApplication;
  const path: string = "/delegation";
  const delegationServiceMocks = mockDelegationService();

  beforeAll(async () => {
    jest.resetAllMocks();
    const moduleFixture = await Test.createTestingModule({
      controllers: [DelegationController],
      imports: [DelegationModule],
    })
      .overrideProvider(DelegationService)
      .useValue(delegationServiceMocks)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  describe("GET /delegation", () => {
    it('should return delegation staking contract information', async () => {
      const mockDelegationDetails = {
        stake: '1000000000000000000000',
        topUp: '500000000000000000000',
        locked: '0',
        minDelegation: '25000000000000000000',
      };
      delegationServiceMocks.getDelegation.mockResolvedValue(mockDelegationDetails);

      await request(app.getHttpServer())
        .get(`${path}`)
        .expect(200)
        .expect(response => {
          expect(response.body).toMatchObject(mockDelegationDetails);
        });
    });
  });

  afterAll(async () => {
    await app.close();
  });
});
