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

  afterAll(async () => {
    await app.close();
  });

  describe('/shards', () => {
    it("should check shards pagination", async () => {
      const checker = new ApiChecker('shards', app.getHttpServer());
      await checker.checkPagination();
    });

    it('should handle pagination error', async () => {
      const checker = new ApiChecker('shards', app.getHttpServer());
      await checker.checkPaginationError();
    });

    it('should check response body for all available shards', async () => {
      const checker = new ApiChecker('shards', app.getHttpServer());
      await expect(checker.checkArrayResponseBody()).resolves.not.toThrowError('Invalid response body!');
    });

    it('should check shards status response code', async () => {
      const checker = new ApiChecker('shards', app.getHttpServer());
      await checker.checkStatus();
    });

    it('should not exceed rate limit', async () => {
      const checker = new ApiChecker('shards', app.getHttpServer());
      await expect(checker.checkRateLimit()).resolves.not.toThrowError('Exceed rate limit for parallel requests!');
    });
  });
});
