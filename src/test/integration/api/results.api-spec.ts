import { CleanupInterceptor, FieldsInterceptor } from '@multiversx/sdk-nestjs-http';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PublicAppModule } from 'src/public.app.module';
import { ApiChecker } from 'src/utils/api.checker';

describe("API Testing", () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [PublicAppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalInterceptors(
      new FieldsInterceptor(),
      new CleanupInterceptor(),
    );
    await app.init();
  });

  const skipedFields = ['receiverAssets'];

  afterAll(async () => {
    await app.close();
  });

  describe('/results', () => {
    it("should check results pagination", async () => {
      const checker = new ApiChecker('results', app.getHttpServer());
      await checker.checkPagination();
    });

    it('should handle pagination error', async () => {
      const checker = new ApiChecker('results', app.getHttpServer());
      await checker.checkPaginationError();
    });

    it('should check results status response code', async () => {
      const checker = new ApiChecker('results', app.getHttpServer());
      await checker.checkStatus();
    });

    it('should check response body for all smart contract results available on the blockchain', async () => {
      const checker = new ApiChecker(`results`, app.getHttpServer());
      await expect(checker.checkArrayResponseBody()).resolves.not.toThrowError('Invalid response body!');
    });

    it('should check results details', async () => {
      const checker = new ApiChecker('results', app.getHttpServer());
      checker.skipFields = skipedFields;
      await checker.checkDetails();
    });

    it('should not exceed rate limit', async () => {
      const checker = new ApiChecker('results', app.getHttpServer());
      await expect(checker.checkRateLimit()).resolves.not.toThrowError('Exceed rate limit for parallel requests!');
    });
  });

  describe('/results/count', () => {
    it('should check results count', async () => {
      const checker = new ApiChecker(`results/count`, app.getHttpServer());
      await checker.checkStatus();
    });
  });

  describe('/results/{scHash}', () => {
    it('should handle valid data', async () => {
      const scHash: string = 'fdbf4c1bf44655ec2403dfb9798ec741049b3a76ae768561b07b2e082e565087';
      const checker = new ApiChecker(`results/${scHash}`, app.getHttpServer());
      await checker.checkStatus();
    });

    it('should handle invalid data', async () => {
      const scHash: string = 'fdbf4c168561b07b2e082e565087';
      const checker = new ApiChecker(`results/${scHash}`, app.getHttpServer());
      await expect(checker.checkStatus()).rejects.toThrowError('Endpoint status code 400');
    });

    it('should not exceed rate limit for parallel requests', async () => {
      const scHash: string = 'fdbf4c1bf44655ec2403dfb9798ec741049b3a76ae768561b07b2e082e565087';
      const checker = new ApiChecker(`results/${scHash}`, app.getHttpServer());
      await expect(checker.checkRateLimit()).resolves.not.toThrowError('Exceed rate limit for parallel requests!');
    });
  });
});
