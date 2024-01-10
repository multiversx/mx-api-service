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
      // @ts-ignore
      new FieldsInterceptor(),
      new CleanupInterceptor(),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/tags', () => {
    it('should check tags pagination', async () => {
      const checker = new ApiChecker(`tags`, app.getHttpServer());
      await checker.checkPagination();
    });

    it('should handle exceeding the limit value for "from" and "size" parameters', async () => {
      const fromNumber = 30;
      const sizeNumber = 9975;
      const checker = new ApiChecker(`tags?from=${fromNumber}&size=${sizeNumber}`, app.getHttpServer());
      await expect(checker.checkWindow(fromNumber, sizeNumber)).rejects.toThrowError('Result window is too large!');
    });

    it('should check tags status response code', async () => {
      const checker = new ApiChecker(`tags`, app.getHttpServer());
      await checker.checkStatus();
    });

    it('should check response body for all distinct NFT tags', async () => {
      const checker = new ApiChecker(`tags`, app.getHttpServer());
      await expect(checker.checkTagsResponseBody()).resolves.not.toThrowError('Invalid response body for tags!');
    });

    it('should check "search" filter', async () => {
      const value: string = 'multiversx';
      const checker = new ApiChecker(`tags?search=${value}`, app.getHttpServer());
      await checker.checkStatus();
    });
  });

  describe('/tags/count', () => {
    it('should check tags count', async () => {
      const checker = new ApiChecker(`tags/count`, app.getHttpServer());
      await checker.checkStatus();
    });
  });

  describe('/tags/{tag}', () => {
    it('should handle valid data', async () => {
      const tag: string = 'sunny';
      const checker = new ApiChecker(`tags/${tag}`, app.getHttpServer());
      await checker.checkStatus();
    });

    it('should handle invalid data', async () => {
      const tag: string = 'aa';
      const checker = new ApiChecker(`tags/${tag}`, app.getHttpServer());
      await expect(checker.checkStatus()).rejects.toThrowError('Endpoint status code 404');
    });
  });
});
