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

  describe('/mex/economics', () => {
    it('should check mex/economics status response code', async () => {
      const checker = new ApiChecker('mex/economics', app.getHttpServer());
      await checker.checkStatus();
    });

    it('should check response body for economics details of xExchange', async () => {
      const checker = new ApiChecker('mex/economics', app.getHttpServer());
      await expect(checker.checkObjectResponseBody()).resolves.not.toThrowError('Invalid response body!');
    });

    it('should not exceed rate limit', async () => {
      const checker = new ApiChecker('mex/economics', app.getHttpServer());
      await expect(checker.checkRateLimit()).resolves.not.toThrowError('Exceed rate limit for parallel requests!');
    });
  });

  describe('/mex/pairs', () => {
    it('should check mex/pairs status response code', async () => {
      const checker = new ApiChecker('mex/pairs', app.getHttpServer());
      await checker.checkStatus();
    });

    it('should check response body for active liquidity pools available on xExchange', async () => {
      const checker = new ApiChecker('mex/pairs', app.getHttpServer());
      await expect(checker.checkArrayResponseBody()).resolves.not.toThrowError('Invalid response body!');
    });

    it('should check mex/pairs pagination', async () => {
      const checker = new ApiChecker('mex/pairs', app.getHttpServer());
      await checker.checkPagination();
    });

    it('should handle pagination error', async () => {
      const checker = new ApiChecker('mex/pairs', app.getHttpServer());
      await checker.checkPaginationError();
    });

    it('should not exceed rate limit', async () => {
      const checker = new ApiChecker('mex/pairs', app.getHttpServer());
      await expect(checker.checkRateLimit()).resolves.not.toThrowError('Exceed rate limit for parallel requests!');
    });
  });

  describe('/mex/pairs/count', () => {
    it('should check status response code for active liquidity pools count', async () => {
      const checker = new ApiChecker('mex/pairs/count', app.getHttpServer());
      await checker.checkStatus();
    });
  });

  describe('/mex/tokens', () => {
    it('should check mex/tokens status response code', async () => {
      const checker = new ApiChecker('mex/tokens', app.getHttpServer());
      await checker.checkStatus();
    });

    it('should check response body for a list of tokens listed on xExchange', async () => {
      const checker = new ApiChecker('mex/tokens', app.getHttpServer());
      await expect(checker.checkArrayResponseBody()).resolves.not.toThrowError('Invalid response body!');
    });

    it('should check mex/tokens pagination', async () => {
      const checker = new ApiChecker('mex/tokens', app.getHttpServer());
      await checker.checkPagination();
    });

    it('should handle pagination error', async () => {
      const checker = new ApiChecker('mex/tokens', app.getHttpServer());
      await checker.checkPaginationError();
    });

    it('should not exceed rate limit', async () => {
      const checker = new ApiChecker('mex/tokens', app.getHttpServer());
      await expect(checker.checkRateLimit()).resolves.not.toThrowError('Exceed rate limit for parallel requests!');
    });
  });

  describe('/mex/tokens/count', () => {
    it('should check status response code for tokens count available on Maiar Exchange', async () => {
      const checker = new ApiChecker('mex/tokens/count', app.getHttpServer());
      await checker.checkStatus();
    });
  });

  describe('/mex/tokens/{identifier}', () => {
    it('should check mex/tokens/{identifier} status response code', async () => {
      const identifier: string = 'MEX-455c57';
      const checker = new ApiChecker(`mex/tokens/${identifier}`, app.getHttpServer());
      await checker.checkStatus();
    });

    it('should handle invalid value for identifier parameter', async () => {
      const identifier: string = 'MEX';
      const checker = new ApiChecker(`mex/tokens/${identifier}`, app.getHttpServer());
      await expect(checker.checkStatus()).rejects.toThrowError('Endpoint status code 400');
    });
  });

  describe('/mex/farms', () => {
    it('should check mex/farms status response code', async () => {
      const checker = new ApiChecker('mex/farms', app.getHttpServer());
      await checker.checkStatus();
    });

    it('should check response body for  a list of farms listed on xExchange', async () => {
      const checker = new ApiChecker('mex/farms', app.getHttpServer());
      await expect(checker.checkArrayResponseBody()).resolves.not.toThrowError('Invalid response body!');
    });

    it('should check mex/farms pagination', async () => {
      const checker = new ApiChecker('mex/farms', app.getHttpServer());
      await checker.checkPagination();
    });

    it('should handle pagination error', async () => {
      const checker = new ApiChecker('mex/farms', app.getHttpServer());
      await checker.checkPaginationError();
    });

    it('should not exceed rate limit', async () => {
      const checker = new ApiChecker('mex/farms', app.getHttpServer());
      await expect(checker.checkRateLimit()).resolves.not.toThrowError('Exceed rate limit for parallel requests!');
    });
  });

  describe('/mex/farms/count', () => {
    it('should check status response code for farms count available on Maiar Exchange', async () => {
      const checker = new ApiChecker('mex/farms/count', app.getHttpServer());
      await checker.checkStatus();
    });
  });

  describe('/mex/pairs/{baseId}/{quoteId}', () => {
    it('should check mex/pairs/{baseId}/{quoteId} status response code', async () => {
      const baseId: string = 'MEX-455c57';
      const quoteId: string = 'WEGLD-bd4d79';
      const checker = new ApiChecker(`mex/pairs/${baseId}/${quoteId}`, app.getHttpServer());
      await checker.checkStatus();
    });

    it('should handle invalid value for baseId parameter', async () => {
      const baseId: string = 'MEX';
      const quoteId: string = 'WEGLD-bd4d79';
      const checker = new ApiChecker(`mex/pairs/${baseId}/${quoteId}`, app.getHttpServer());
      await expect(checker.checkStatus()).rejects.toThrowError('Endpoint status code 404');
    });
  });
});
