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

  it('should check accounts pagination', async () => {
    const checker = new ApiChecker('accounts', app.getHttpServer());
    checker.skipFields = skipedFields;
    await checker.checkPagination();
  });

  it('should check accounts status response code', async () => {
    const checker = new ApiChecker('accounts', app.getHttpServer());
    checker.skipFields = skipedFields;
    await checker.checkStatus();
  });

  it('should check accounts count', async () => {
    const checker = new ApiChecker('accounts', app.getHttpServer());
    checker.skipFields = skipedFields;
    await checker.checkAlternativeCount();
  });

  it('should check accounts details', async () => {
    const checker = new ApiChecker('accounts', app.getHttpServer());
    checker.skipFields = skipedFields;
    await checker.checkDetails();
  });

  describe('Error Handling Tests', () => {
    it('should handle invalid values for from and size parameters', async () => {
      const fromNumber = 30;
      const sizeNumber = 9975;
      const checker = new ApiChecker(`accounts?from=${fromNumber}&size=${sizeNumber}`, app.getHttpServer());
      await expect(checker.checkWindow(fromNumber, sizeNumber)).rejects.toThrowError('Result window is too large!');
    });

    it('should handle invalid value for from parameter', async () => {
      const fromNumber = 9976;
      const checker = new ApiChecker(`accounts?from=${fromNumber}`, app.getHttpServer());
      await expect(checker.checkWindow(fromNumber)).rejects.toThrowError('Result window is too large!');
    });

    it('should handle invalid value for size parameter', async () => {
      const sizeNumber = 10003;
      const checker = new ApiChecker(`accounts?size=${sizeNumber}`, app.getHttpServer());
      await expect(checker.checkWindow(sizeNumber)).rejects.toThrowError('Result window is too large!');
    });

    it('should handle invalid value for address parameter', async () => {
      const address: string = 'erd1qga7zhxqf2226nzrxnyhzer9lmudqhjgy7ycqjjyknz';
      const checker = new ApiChecker(`accounts/${address}`, app.getHttpServer());
      await expect(checker.checkStatus()).rejects.toThrowError('Endpoint status code 400');
    });
  });

  describe('Rate Limit Testing', () => {
    it('should not exceed rate limit: 2 requests / IP / second', async () => {
      const checker = new ApiChecker('accounts', app.getHttpServer());
      const startTime = Date.now();
      await checker.checkStatus();
      await checker.checkStatus();
      const endTime = Date.now();
      const duration = endTime - startTime;
      expect(duration).toBeLessThan(1000);
    });

    it('should not exceed rate limit for parallel requests', async () => {
      const queryParams = { ownerAddress: 'erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqplllst77y4l' };
      const checker = new ApiChecker(`accounts/count?${queryParams.ownerAddress}`, app.getHttpServer());
      checker.skipFields = skipedFields;
      const startTime = Date.now();
      await checker.checkAlternativeCount(queryParams);
      const endTime = Date.now();
      const duration = endTime - startTime;
      expect(duration).toBeLessThan(1000);
    });

    it('should not exceed rate limit for parallel requests', async () => {
      const checker = new ApiChecker('accounts', app.getHttpServer());
      const startTime = Date.now();
      await Promise.all([
        await checker.checkStatus(),
        await checker.checkStatus()
      ]);
      const endTime = Date.now();
      const duration = endTime - startTime;
      expect(duration).toBeLessThan(1000);
    });

    it('should check maximum number of items to retrieve: size number', async () => {
      const sizeNumber = 10000;
      const checker = new ApiChecker(`accounts?size=${sizeNumber}`, app.getHttpServer());
      expect(checker.checkWindow(undefined, sizeNumber)).resolves.not.toThrowError('Result window is too large!');
    }, 5000);

    it('should check maximum number of items to skip from the result set: from number', async () => {
      const fromNumber = 9975;
      const checker = new ApiChecker(`accounts?from=${fromNumber}`, app.getHttpServer());
      await expect(checker.checkWindow(fromNumber)).resolves.not.toThrowError('Result window is too large!');
    }, 5000);

    it('should check maximum number of items to skip and to retrive for the result set: form + size numbers', async () => {
      const fromNumber = 25;
      const sizeNumber = 9975;
      const checker = new ApiChecker(`accounts?from=${fromNumber}&size=${sizeNumber}`, app.getHttpServer());
      await expect(checker.checkWindow(fromNumber, sizeNumber)).resolves.not.toThrowError('Result window is too large!');
    });
  });

  describe('Response Format Validation', () => {
    it('should check response body for all accounts available on blockchain', async () => {
      const checker = new ApiChecker('accounts', app.getHttpServer());
      await expect(checker.checkAccountsResponseBody()).resolves.not.toThrowError('Invalid response body for accounts!');
    });

    it('should return total number of accounts count (alternative) searched by owner address', async () => {
      const queryParams = { ownerAddress: 'erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqplllst77y4l' };
      const checker = new ApiChecker(`accounts/count?${queryParams.ownerAddress}`, app.getHttpServer());
      checker.skipFields = skipedFields;
      await checker.checkAlternativeCount(queryParams);
    });
  });

  describe('Concurrent Testing', () => {
    it('should check the sorting of the accounts according to the sort accounts criterias ', async () => {
      const checker = new ApiChecker('accounts', app.getHttpServer());
      const sortCriterias = ['balance', 'timestamp'];
      const promises = sortCriterias.map(async (sort) => {
        await checker.checkFilter([sort]);
      });
      await Promise.all(promises);
    });
  });
});
