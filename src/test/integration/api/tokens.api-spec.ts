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

  const skipedFields = ['error', 'message', 'statusCode'];

  afterAll(async () => {
    await app.close();
  });

  describe('/tokens', () => {
    it("should check tokens pagination", async () => {
      const checker = new ApiChecker('tokens', app.getHttpServer());
      checker.skipFields = skipedFields;
      await checker.checkPagination();
    });

    it('should handle pagination error', async () => {
      const checker = new ApiChecker('tokens', app.getHttpServer());
      checker.skipFields = skipedFields;
      await checker.checkPaginationError();
    });

    it('should check tokens status response code', async () => {
      const checker = new ApiChecker('tokens', app.getHttpServer());
      checker.skipFields = skipedFields;
      await checker.checkStatus();
    });

    it('should check response body for all tokens available on the blockchain', async () => {
      const checker = new ApiChecker('tokens', app.getHttpServer());
      await expect(checker.checkArrayResponseBody()).resolves.not.toThrowError('Invalid response body!');
    });

    it('should check tokens details', async () => {
      const checker = new ApiChecker('tokens', app.getHttpServer());
      checker.skipFields = skipedFields;
      await checker.checkTokensDetails();
    });

    it('should check the sorting of the tokens according to the sort tokens criterias ', async () => {
      const checker = new ApiChecker('tokens', app.getHttpServer());
      checker.skipFields = skipedFields;
      const sortCriterias = ['accounts', 'transactions', 'price', 'marketCap'];
      const promises = sortCriterias.map(async (sort) => {
        await checker.checkFilter([sort]);
      });
      await Promise.all(promises);
    });

    it('should not exceed rate limit', async () => {
      const checker = new ApiChecker('tokens', app.getHttpServer());
      await expect(checker.checkRateLimit()).resolves.not.toThrowError('Exceed rate limit for parallel requests!');
    });
  });

  describe('/tokens/count', () => {
    it('should check tokens count', async () => {
      const checker = new ApiChecker('tokens', app.getHttpServer());
      checker.skipFields = skipedFields;
      await checker.checkAlternativeCount();
    });
  });

  describe('/tokens/{identifier}', () => {
    it('should check /tokens/{identifier} status response code', async () => {
      const identifier: string = 'MEX-455c57';
      const checker = new ApiChecker(`tokens/${identifier}`, app.getHttpServer());
      checker.skipFields = skipedFields;
      await checker.checkStatus();
    });

    it('should handle invalid value for identifier parameter', async () => {
      const identifier: string = 'MEX-45';
      const checker = new ApiChecker(`tokens/${identifier}`, app.getHttpServer());
      checker.skipFields = skipedFields;
      await expect(checker.checkStatus()).rejects.toThrowError('Endpoint status code 400');
    });
  });
});
