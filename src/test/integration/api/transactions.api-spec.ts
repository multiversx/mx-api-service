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

  describe('/transactions', () => {
    it('should check transactions status response code', async () => {
      const checker = new ApiChecker('transactions', app.getHttpServer());
      await checker.checkStatus();
    });

    it('should check response body for a list of transactions available on the blockchain', async () => {
      const checker = new ApiChecker('transactions', app.getHttpServer());
      await expect(checker.checkArrayResponseBody()).resolves.not.toThrowError('Invalid response body!');
    });

    it('should check a list of transactions available on the blockchain with the maximum requested size=50', async () => {
      const queryParams = {
        size: 50,
        withScResults: true,
      };
      const checker = new ApiChecker(`transactions?size=${queryParams.size}&withScResults=${queryParams.withScResults}`, app.getHttpServer());
      await expect(checker.checkWindowForTransactions(queryParams.size)).resolves.not.toThrowError('Complexity exceeded threshold 10000.');
    });

    it('should check a list of transactions available on the blockchain with the maximum requested size=50 and some fields', async () => {
      const queryParams = {
        size: 50,
        withOperations: true,
        withLogs: true,
        withScResults: true,
      };
      const checker = new ApiChecker(`transactions?size=${queryParams.size}&withOperations=${queryParams.withOperations}&withLogs=${queryParams.withLogs}&withScResults=${queryParams.withScResults}`, app.getHttpServer());
      await expect(checker.checkWindowForTransactions(queryParams.size)).resolves.not.toThrowError('Complexity exceeded threshold 10000.');
    });

    it('should handle complexity exceeded', async () => {
      const queryParams = {
        size: 60,
        withOperations: true,
        withLogs: true,
        withScResults: true,
      };
      const checker = new ApiChecker(`transactions?size=${queryParams.size}&withOperations=${queryParams.withOperations}&withLogs=${queryParams.withLogs}&withScResults=${queryParams.withScResults}`, app.getHttpServer());
      await expect(checker.checkWindowForTransactions(queryParams.size)).rejects.toThrowError('Complexity exceeded threshold 10000.');
    });

    it('should check the sorting of the transactions according to the sort transactions criterias ', async () => {
      const checker = new ApiChecker('transactions', app.getHttpServer());
      const sortCriterias = ['timestamp'];
      const promises = sortCriterias.map(async (sort) => {
        await checker.checkFilter([sort]);
      });
      await Promise.all(promises);
    });

    it('should not exceed rate limit', async () => {
      const checker = new ApiChecker('transactions', app.getHttpServer());
      await expect(checker.checkRateLimit()).resolves.not.toThrowError('Exceed rate limit for parallel requests!');
    });
  });

  describe('/transactions/count', () => {
    it('should check transactions alternative count', async () => {
      const checker = new ApiChecker('transactions', app.getHttpServer());
      await checker.checkAlternativeCount();
    });
  });

  describe('/transactions/{txHash}', () => {
    it('should check transactions/{txHash} status response code', async () => {
      const txHash: string = '169d4690108d9598e8164ee53675899e69d040cc35d81f6e2b7209a9e08a7217';
      const checker = new ApiChecker(`transactions/${txHash}`, app.getHttpServer());
      await checker.checkStatus();
    });

    it('should handle invalid value for txHash parameter', async () => {
      const txHash: string = '169d4690108d9598e8164ee53675899e68a7217';
      const checker = new ApiChecker(`transactions/${txHash}`, app.getHttpServer());
      await expect(checker.checkStatus()).rejects.toThrowError('Endpoint status code 400');
    });
  });
});
