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

  describe('/dapp/config', () => {
    it('should check dapp/config status response code', async () => {
      const checker = new ApiChecker('dapp/config', app.getHttpServer());
      await checker.checkStatus();
    });

    it('should check dapp/config response body', async () => {
      const checker = new ApiChecker('dapp/config', app.getHttpServer());
      await checker.checkObjectResponseBody();
    });

    it('should not exceed rate limit', async () => {
      const checker = new ApiChecker('dapp/config', app.getHttpServer());
      await expect(checker.checkRateLimit()).resolves.not.toThrowError('Exceed rate limit for parallel requests!');
    });
  });
});
