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

  describe('/usernames/{username}', () => {
    it('should check stake status response code', async () => {
      const username: string = 'alice';
      const checker = new ApiChecker(`usernames/${username}`, app.getHttpServer());
      checker.defaultParams = { withGuardianInfo: false };
      await checker.checkStatus();
    });

    it('should check response body for a given username', async () => {
      const username: string = 'alice';
      const checker = new ApiChecker(`usernames/${username}`, app.getHttpServer());
      checker.defaultParams = { withGuardianInfo: false };
      await expect(checker.checkObjectResponseBody()).resolves.not.toThrowError('Invalid response body!');
    });

    it('should not exceed rate limit', async () => {
      const username: string = 'alice';
      const checker = new ApiChecker(`usernames/${username}`, app.getHttpServer());
      await expect(checker.checkRateLimit()).resolves.not.toThrowError('Exceed rate limit for parallel requests!');
    });
  });
});
