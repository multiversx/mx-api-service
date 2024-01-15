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

  describe('/constants', () => {
    it('should check constants status response code', async () => {
      const checker = new ApiChecker('constants', app.getHttpServer());
      await checker.checkStatus();
    });

    it('should check response body for network-specific constants', async () => {
      const checker = new ApiChecker('constants', app.getHttpServer());
      await expect(checker.checkObjectResponseBody()).resolves.not.toThrowError('Invalid response body!');
    });

    it('should not exceed rate limit', async () => {
      const checker = new ApiChecker('constants', app.getHttpServer());
      await expect(checker.checkRateLimit()).resolves.not.toThrowError('Exceed rate limit for parallel requests!');
    });
  });

  describe('/economics', () => {
    it('should check economics status response code', async () => {
      const checker = new ApiChecker('economics', app.getHttpServer());
      await checker.checkStatus();
    });

    it('should check response body for general economics information', async () => {
      const checker = new ApiChecker('economics', app.getHttpServer());
      await expect(checker.checkObjectResponseBody()).resolves.not.toThrowError('Invalid response body!');
    });

    it('should not exceed rate limit', async () => {
      const checker = new ApiChecker('economics', app.getHttpServer());
      await expect(checker.checkRateLimit()).resolves.not.toThrowError('Exceed rate limit for parallel requests!');
    });
  });

  describe('/stats', () => {
    it('should check stats status response code', async () => {
      const checker = new ApiChecker('stats', app.getHttpServer());
      await checker.checkStatus();
    });

    it('should check response body for general network statistics', async () => {
      const checker = new ApiChecker('stats', app.getHttpServer());
      await expect(checker.checkObjectResponseBody()).resolves.not.toThrowError('Invalid response body!');
    });

    it('should not exceed rate limit', async () => {
      const checker = new ApiChecker('stats', app.getHttpServer());
      await expect(checker.checkRateLimit()).resolves.not.toThrowError('Exceed rate limit for parallel requests!');
    });
  });

  describe('/about', () => {
    it('should check about status response code', async () => {
      const checker = new ApiChecker('about', app.getHttpServer());
      await checker.checkStatus();
    });

    it('should check response body for general information about API deployment', async () => {
      const checker = new ApiChecker('about', app.getHttpServer());
      await expect(checker.checkObjectResponseBody()).resolves.not.toThrowError('Invalid response body!');
    });

    it('should not exceed rate limit', async () => {
      const checker = new ApiChecker('about', app.getHttpServer());
      await expect(checker.checkRateLimit()).resolves.not.toThrowError('Exceed rate limit for parallel requests!');
    });
  });
});
