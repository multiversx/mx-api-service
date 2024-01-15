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

  const skipedFields = ['balance', 'nonce', 'timestamp'];

  afterAll(async () => {
    await app.close();
  });

  describe('/accounts', () => {
    it('should check accounts pagination', async () => {
      const checker = new ApiChecker('accounts', app.getHttpServer());
      checker.skipFields = skipedFields;
      await checker.checkPagination();
    });

    it('should handle pagination error', async () => {
      const checker = new ApiChecker('accounts', app.getHttpServer());
      checker.skipFields = skipedFields;
      await checker.checkPaginationError();
    });

    it('should check response body for all accounts available on blockchain', async () => {
      const checker = new ApiChecker('accounts', app.getHttpServer());
      await expect(checker.checkArrayResponseBody()).resolves.not.toThrowError('Invalid response body!');
    });

    it('should check accounts status response code', async () => {
      const checker = new ApiChecker('accounts', app.getHttpServer());
      checker.skipFields = skipedFields;
      await checker.checkStatus();
    });

    it('should check accounts status response code, when all filters are applied', async () => {
      const checker = new ApiChecker(`accounts`, app.getHttpServer());
      checker.defaultParams = { from: 1, size: 3, ownerAddress: 'erd1cc2yw3reulhshp3x73q2wye0pq8f4a3xz3pt7xj79phv9wm978ssu99pvt', sort: 'balance', order: 'desc', isSmartContract: true };
      checker.skipFields = skipedFields;
      await checker.checkStatus();
      await checker.checkArrayResponseBody();
    });

    it('should check accounts details', async () => {
      const checker = new ApiChecker('accounts', app.getHttpServer());
      checker.skipFields = skipedFields;
      await checker.checkDetails();
    });

    it('should not exceed rate limit', async () => {
      const checker = new ApiChecker('accounts', app.getHttpServer());
      await expect(checker.checkRateLimit()).resolves.not.toThrowError('Exceed rate limit for parallel requests!');
    });

    it('should check the sorting of the accounts according to the sort accounts criterias ', async () => {
      const checker = new ApiChecker('accounts', app.getHttpServer());
      const sortCriterias = ['balance', 'timestamp'];
      const promises = sortCriterias.map(async (sort) => {
        await checker.checkFilter([sort]);
      });
      await Promise.all(promises);
    });
  });

  describe('/accounts/count', () => {
    it('should return total number of accounts count (alternative) searched by owner address', async () => {
      const checker = new ApiChecker(`accounts`, app.getHttpServer());
      checker.defaultParams = { ownerAddress: 'erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqplllst77y4l' };
      checker.skipFields = skipedFields;
      await checker.checkAlternativeCount(checker.defaultParams);
    });

    it('should check accounts count', async () => {
      const checker = new ApiChecker('accounts', app.getHttpServer());
      checker.skipFields = skipedFields;
      await checker.checkAlternativeCount();
    });
  });

  describe('/accounts/{address}', () => {
    it('should check accounts/{address} status response code', async () => {
      const address: string = 'erd1qqqqqqqqqqqqqpgq4l2k8cnwgvkh7fmcxv07au8yt2uwe74a78ssz44z2m';
      const checker = new ApiChecker(`accounts/${address}`, app.getHttpServer());
      checker.skipFields = skipedFields;
      await checker.checkStatus();
    });

    it('should handle invalid value for address parameter', async () => {
      const address: string = 'erd1qga7zhxqf2226nzrxnyhzer9lmudqhjgy7ycqjjyknz';
      const checker = new ApiChecker(`accounts/${address}`, app.getHttpServer());
      await expect(checker.checkStatus()).rejects.toThrowError('Endpoint status code 400');
    });
  });
});
