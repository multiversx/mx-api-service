import { ProviderController } from '../../../endpoints/providers/provider.controller';
import { INestApplication, HttpException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PublicAppModule } from 'src/public.app.module';
import request = require('supertest');

describe("Providers Controller", () => {
  let app: INestApplication;
  let providerController: ProviderController;
  const route: string = "/providers";

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [PublicAppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    providerController = moduleRef.get<ProviderController>(ProviderController);

    await app.init();
  });

  it("/providers - should return 200 status code and one list of providers", async () => {
    await request(app.getHttpServer())
      .get(route)
      .expect(200);
  });

  it("/providers?identity - should return 200 status code provider details", async () => {
    const params = new URLSearchParams({
      'identity': 'justminingfr',
    });

    await request(app.getHttpServer())
      .get(route + "?" + params)
      .expect(200);
  });

  it("should return provider", async () => {
    const address: string = "erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqq8hlllls7a6h85";
    const results = await providerController.getProvider(address);

    expect(results.hasOwnProperty("provider")).toBeTruthy();
    expect(results.hasOwnProperty("serviceFee")).toBeTruthy();
    expect(results.hasOwnProperty("delegationCap")).toBeTruthy();
    expect(results.hasOwnProperty("apr")).toBeTruthy();
    expect(results.hasOwnProperty("cumulatedRewards")).toBeTruthy();
    expect(results.hasOwnProperty("numUsers")).toBeTruthy();
    expect(results.hasOwnProperty("identity")).toBeTruthy();
    expect(results.hasOwnProperty("numNodes")).toBeTruthy();
    expect(results.hasOwnProperty("stake")).toBeTruthy();
    expect(results.hasOwnProperty("topUp")).toBeTruthy();
    expect(results.hasOwnProperty("locked")).toBeTruthy();
    expect(results.hasOwnProperty("featured")).toBeTruthy();
  });

  it('should throw HttpException if provider address is not found', async () => {
    const address: string = "undefinedProviderAddress";

    await expect(providerController.getProvider(address)).rejects.toThrow(
      HttpException,
    );
  });
});
