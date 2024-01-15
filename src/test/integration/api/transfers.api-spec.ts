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

  const skipedFields = ['round', 'nonce', 'timestamp'];

  afterAll(async () => {
    await app.close();
  });

  describe('/transfers', () => {
    it('should check transfers status response code', async () => {
      const checker = new ApiChecker('transfers', app.getHttpServer());
      await checker.checkStatus();
    });

    it('should check response body for transfers', async () => {
      const checker = new ApiChecker('transfers', app.getHttpServer());
      await expect(checker.checkArrayResponseBody()).resolves.not.toThrowError('Invalid response body!');
    });

    it('should check transfers pagination', async () => {
      const checker = new ApiChecker('transfers', app.getHttpServer());
      checker.skipFields = skipedFields;
      await checker.checkPagination();
    });

    it('should handle pagination error', async () => {
      const checker = new ApiChecker('transfers', app.getHttpServer());
      await checker.checkPaginationError();
    });

    it('should not exceed rate limit', async () => {
      const checker = new ApiChecker('transfers', app.getHttpServer());
      await expect(checker.checkRateLimit()).resolves.not.toThrowError('Exceed rate limit for parallel requests!');
    });
  });

  describe('/transfers/count', () => {
    it('should return alternative count of transfers', async () => {
      const checker = new ApiChecker(`transfers`, app.getHttpServer());
      await checker.checkAlternativeCount();
    });

    it('should not exceed rate limit for parallel requests', async () => {
      const checker = new ApiChecker(`transfers/count`, app.getHttpServer());
      await expect(checker.checkRateLimit()).resolves.not.toThrowError('Exceed rate limit for parallel requests!');
    });
  });
});
