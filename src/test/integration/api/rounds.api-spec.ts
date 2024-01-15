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

  const skipedFields = ['timestamp'];

  afterAll(async () => {
    await app.close();
  });

  describe('/rounds', () => {
    it('should check rounds status response code', async () => {
      const checker = new ApiChecker('rounds', app.getHttpServer());
      checker.skipFields = skipedFields;
      await checker.checkStatus();
    });

    it('should check rounds details', async () => {
      const checker = new ApiChecker('rounds', app.getHttpServer());
      checker.skipFields = skipedFields;
      await checker.checkDetails();
    });

    it("should check rounds pagination", async () => {
      const checker = new ApiChecker('rounds', app.getHttpServer());
      checker.skipFields = skipedFields;
      await checker.checkPagination();
    });

    it('should handle pagination error', async () => {
      const checker = new ApiChecker('rounds', app.getHttpServer());
      await checker.checkPaginationError();
    });

    it('should check response body for all rounds available on blockchain', async () => {
      const checker = new ApiChecker('rounds', app.getHttpServer());
      checker.skipFields = skipedFields;
      await expect(checker.checkArrayResponseBody()).resolves.not.toThrowError('Invalid response body!');
    });

    it('should not exceed rate limit', async () => {
      const checker = new ApiChecker('rounds', app.getHttpServer());
      await expect(checker.checkRateLimit()).resolves.not.toThrowError('Exceed rate limit for parallel requests!');
    });
  });

  describe('/rounds/count', () => {
    it('should check rounds count', async () => {
      const checker = new ApiChecker('rounds', app.getHttpServer());
      await checker.checkAlternativeCount();
    });
  });

  describe('/rounds/{shard}/{round}', () => {
    it('should handle valid data', async () => {
      const shard: number = 2;
      const round: number = 18144112;
      const checker = new ApiChecker(`rounds/${shard}/${round}`, app.getHttpServer());
      await checker.checkStatus();
    });

    it('should handle invalid data', async () => {
      const shard: number = 7;
      const round: number = 18144112;
      const checker = new ApiChecker(`rounds/${shard}/${round}`, app.getHttpServer());
      await expect(checker.checkStatus()).rejects.toThrowError('Endpoint status code 404');
    });

    it('should not exceed rate limit for parallel requests', async () => {
      const shard: number = 2;
      const round: number = 18144112;
      const checker = new ApiChecker(`rounds/${shard}/${round}`, app.getHttpServer());
      await expect(checker.checkRateLimit()).resolves.not.toThrowError('Exceed rate limit for parallel requests!');
    });
  });
});
