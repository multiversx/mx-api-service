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

  describe('/nodes', () => {
    it('should check nodes pagination', async () => {
      const checker = new ApiChecker('nodes', app.getHttpServer());
      await checker.checkPagination();
    });

    it('should handle pagination error', async () => {
      const checker = new ApiChecker('nodes', app.getHttpServer());
      await checker.checkPaginationError();
    });

    it('should check nodes status response code', async () => {
      const checker = new ApiChecker('nodes', app.getHttpServer());
      await checker.checkStatus();
    });

    it('should check response body for a list of nodes of type observer or validator', async () => {
      const checker = new ApiChecker('nodes', app.getHttpServer());
      await expect(checker.checkArrayResponseBody()).resolves.not.toThrowError('Invalid response body!');
    });

    it('should check the sorting of the nodes according to the sort nodes criterias ', async () => {
      const checker = new ApiChecker('nodes', app.getHttpServer());
      const sortCriterias = ['tempRating'];
      const promises = sortCriterias.map(async (sort) => {
        await checker.checkFilter([sort]);
      });
      await Promise.all(promises);
    });

    it('should not exceed rate limit', async () => {
      const checker = new ApiChecker('nodes', app.getHttpServer());
      await expect(checker.checkRateLimit()).resolves.not.toThrowError('Exceed rate limit for parallel requests!');
    });
  });

  describe('/nodes/versions', () => {
    it('should check nodes/versions status response code', async () => {
      const checker = new ApiChecker('nodes/versions', app.getHttpServer());
      await checker.checkStatus();
    });

    it('should check response body for breakdown of node versions for validator nodes', async () => {
      const checker = new ApiChecker('nodes/versions', app.getHttpServer());
      await expect(checker.checkObjectResponseBody()).resolves.not.toThrowError('Invalid response body!');
    });
  });

  describe('/nodes/count', () => {
    it('should check nodes alternative count', async () => {
      const checker = new ApiChecker('nodes', app.getHttpServer());
      await checker.checkAlternativeCount();
    });
  });

  describe('/nodes/{bls}', () => {
    it('should check nodes/{address} status response code', async () => {
      const bls: string = '00198be6aae517a382944cd5a97845857f3b122bb1edf1588d60ed421d32d16ea2767f359a0d714fae3a35c1b0cf4e1141d701d5d1d24160e49eeaebeab21e2f89a2b7c44f3a313383d542e69800cfb6e115406d3d8114b4044ef5a04acf0408';
      const checker = new ApiChecker(`nodes/${bls}`, app.getHttpServer());
      await checker.checkStatus();
    });

    it('should handle invalid value for bls parameter', async () => {
      const bls: string = '00198be6aae517a382944cd5a97845857f3b122bb1edf1588d60ed421d32d16ea2767f359a0d714fae3a35c1b0cf4e1141d701d5d1d24160e49eeaebeab21e2f89a2b7c44f3a313383d542e5a04acf0408';
      const checker = new ApiChecker(`nodes/${bls}`, app.getHttpServer());
      await expect(checker.checkStatus()).rejects.toThrowError('Endpoint status code 400');
    });
  });
});
