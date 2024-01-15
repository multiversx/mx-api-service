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

  describe('/providers', () => {
    it('should check providers status response code', async () => {
      const checker = new ApiChecker('providers', app.getHttpServer());
      await checker.checkStatus();
    });

    it('should check response body for all providers', async () => {
      const checker = new ApiChecker('providers', app.getHttpServer());
      await expect(checker.checkArrayResponseBody()).resolves.not.toThrowError('Invalid response body!');
    });

    it('should check providers details', async () => {
      const checker = new ApiChecker('providers', app.getHttpServer());
      await checker.checkDetails('provider');
    });

    it('should not exceed rate limit', async () => {
      const checker = new ApiChecker('providers', app.getHttpServer());
      await expect(checker.checkRateLimit()).resolves.not.toThrowError('Exceed rate limit for parallel requests!');
    });
  });

  describe('/providers/{address}', () => {
    it('should check provider details for a given address status response code', async () => {
      const address: string = 'erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqhllllsajxzat';
      const checker = new ApiChecker(`providers/${address}`, app.getHttpServer());
      await checker.checkStatus();
    });

    it('should handle invalid data', async () => {
      const address: string = 'erd1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqhllllsajxzat';
      const checker = new ApiChecker(`providers/${address}`, app.getHttpServer());
      await expect(checker.checkStatus()).rejects.toThrowError('Endpoint status code 400');
    });
  });

  describe('/providers/{address}/avatar', () => {
    it('should check the avatar of a specific provider address status response code', async () => {
      const address: string = 'erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqhllllsajxzat';
      const checker = new ApiChecker(`providers/${address}/avatar`, app.getHttpServer());
      await checker.checkStatus();
    });
  });
});
