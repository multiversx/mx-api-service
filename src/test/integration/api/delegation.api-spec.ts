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

  describe('/delegation', () => {
    it('should check delegation status response code', async () => {
      const checker = new ApiChecker('delegation', app.getHttpServer());
      await checker.checkStatus();
    });

    it('should check delegation response body', async () => {
      const checker = new ApiChecker('delegation', app.getHttpServer());
      await checker.checkObjectResponseBody();
    });

    it('should not exceed rate limit: 2 requests / IP / second', async () => {
      const checker = new ApiChecker('delegation', app.getHttpServer());
      const startTime = Date.now();
      await checker.checkStatus();
      await checker.checkStatus();
      const endTime = Date.now();
      const duration = endTime - startTime;
      expect(duration).toBeLessThan(1000);
    });

    it('should not exceed rate limit', async () => {
      const checker = new ApiChecker('delegation', app.getHttpServer());
      await expect(checker.checkRateLimit()).resolves.not.toThrowError('Exceed rate limit for parallel requests!');
    });
  });

  describe('/delegation-legacy', () => {
    it('should check delegation-legacy status response code', async () => {
      const checker = new ApiChecker('delegation-legacy', app.getHttpServer());
      await checker.checkStatus();
    });

    it('should check delegation-legacy response body', async () => {
      const checker = new ApiChecker('delegation-legacy', app.getHttpServer());
      await checker.checkObjectResponseBody();
    });

    it('should not exceed rate limit: 2 requests / IP / second', async () => {
      const checker = new ApiChecker('delegation-legacy', app.getHttpServer());
      const startTime = Date.now();
      await checker.checkStatus();
      await checker.checkStatus();
      const endTime = Date.now();
      const duration = endTime - startTime;
      expect(duration).toBeLessThan(1000);
    });

    it('should not exceed rate limit', async () => {
      const checker = new ApiChecker('delegation-legacy', app.getHttpServer());
      await expect(checker.checkRateLimit()).resolves.not.toThrowError('Exceed rate limit for parallel requests!');
    });
  });
});
