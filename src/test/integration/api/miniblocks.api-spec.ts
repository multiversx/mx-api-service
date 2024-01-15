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

  describe('/miniblocks', () => {
    it('should check miniblocks pagination', async () => {
      const checker = new ApiChecker('miniblocks', app.getHttpServer());
      await checker.checkPagination();
    });

    it('should handle pagination error', async () => {
      const checker = new ApiChecker('miniblocks', app.getHttpServer());
      await checker.checkPaginationError();
    });

    it('should check miniblocks status response code', async () => {
      const checker = new ApiChecker('miniblocks', app.getHttpServer());
      await checker.checkStatus();
    });

    it('should check response body for all distinct miniblocks', async () => {
      const checker = new ApiChecker('miniblocks', app.getHttpServer());
      await expect(checker.checkArrayResponseBody()).resolves.not.toThrowError('Invalid response body!');
    });

    it('should not exceed rate limit', async () => {
      const checker = new ApiChecker('miniblocks', app.getHttpServer());
      await expect(checker.checkRateLimit()).resolves.not.toThrowError('Exceed rate limit for parallel requests!');
    });

    it('should not exceed rate limit for parallel requests', async () => {
      const checker = new ApiChecker('miniblocks', app.getHttpServer());
      const startTime = Date.now();
      await Promise.all([
        await checker.checkStatus(),
        await checker.checkStatus(),
      ]);
      const endTime = Date.now();
      const duration = endTime - startTime;
      expect(duration).toBeLessThan(1000);
    });
  });

  describe('/miniblocks/{miniBlockHash}', () => {
    it('should check miniblocks/{miniBlockHash} status response code', async () => {
      const miniBlockHash: string = '4d857906bed8ac35cde316186ae36d7d90c42155b94e2408c824c4f54658141a';
      const checker = new ApiChecker(`miniblocks/${miniBlockHash}`, app.getHttpServer());
      await checker.checkStatus();
    });

    it('should handle invalid data for a given miniBlockHash', async () => {
      const miniBlockHash: string = '4d857906bed8ac';
      const checker = new ApiChecker(`miniblocks/${miniBlockHash}`, app.getHttpServer());
      await expect(checker.checkStatus()).rejects.toThrowError('Endpoint status code 400');
    });

    it('should not exceed rate limit', async () => {
      const checker = new ApiChecker('miniblocks', app.getHttpServer());
      await expect(checker.checkRateLimit()).resolves.not.toThrowError('Exceed rate limit for parallel requests!');
    });
  });
});
