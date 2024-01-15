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

  const skipedFields = ['message', 'statusCode'];

  afterAll(async () => {
    await app.close();
  });

  describe('/nfts', () => {
    it('should check nfts pagination', async () => {
      const checker = new ApiChecker('nfts', app.getHttpServer());
      checker.skipFields = skipedFields;
      await checker.checkPagination();
    });

    it('should handle pagination error', async () => {
      const checker = new ApiChecker('nfts', app.getHttpServer());
      checker.skipFields = skipedFields;
      await checker.checkPaginationError();
    });

    it('should check nfts status response code', async () => {
      const checker = new ApiChecker('nfts', app.getHttpServer());
      checker.skipFields = skipedFields;
      await checker.checkStatus();
    });

    it('should check response body for a list of Non-Fungible / Semi-Fungible / MetaESDT tokens available on blockchain', async () => {
      const checker = new ApiChecker('nfts', app.getHttpServer());
      await expect(checker.checkArrayResponseBody()).resolves.not.toThrowError('Invalid response body!');
    });

    it('should not exceed rate limit', async () => {
      const checker = new ApiChecker('nfts', app.getHttpServer());
      await expect(checker.checkRateLimit()).resolves.not.toThrowError('Exceed rate limit for parallel requests!');
    });
  });

  describe('/nfts/count', () => {
    it('should check nfts count', async () => {
      const checker = new ApiChecker('nfts', app.getHttpServer());
      checker.skipFields = skipedFields;
      await checker.checkAlternativeCount();
    });
  });

  describe('/nfts/{identifier}', () => {
    it('should check nfts/{identifier} status response code', async () => {
      const identifier: string = 'CITEM-bdf5f1-047338';
      const checker = new ApiChecker(`nfts/${identifier}`, app.getHttpServer());
      checker.skipFields = skipedFields;
      await checker.checkStatus();
    });

    it('should handle invalid value for identifier parameter', async () => {
      const identifier: string = 'aa';
      const checker = new ApiChecker(`nfts/${identifier}`, app.getHttpServer());
      await expect(checker.checkStatus()).rejects.toThrowError('Endpoint status code 400');
    });
  });
});
