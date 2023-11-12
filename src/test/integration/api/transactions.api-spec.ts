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

  it('should check transactions status response code', async () => {
    const checker = new ApiChecker('transactions', app.getHttpServer());
    await checker.checkStatus();
  });

  it('should check transactions count', async () => {
    const checker = new ApiChecker('transactions', app.getHttpServer());
    await checker.checkAlternativeCount();
  });

  describe('Rate Limit Testing', () => {
    it('should check a list of transactions available on the blockchain with the maximum requested size=50', async () => {
      const queryParams = {
        size: 50,
        withScResults: true
      };
      const checker = new ApiChecker(`transactions?size=${queryParams.size}&withScResults=${queryParams.withScResults}`, app.getHttpServer());
      await expect(checker.checkWindowForTransactions(queryParams.size)).resolves.not.toThrowError('Complexity exceeded threshold 10000.');
    });

    it('should check a list of transactions available on the blockchain with the maximum requested size=50 and some fields', async () => {
      const queryParams = {
        size: 50,
        withOperations: true,
        withLogs: true,
        withScResults: true
      };
      const checker = new ApiChecker(`transactions?size=${queryParams.size}&withOperations=${queryParams.withOperations}&withLogs=${queryParams.withLogs}&withScResults=${queryParams.withScResults}`, app.getHttpServer());
      await expect(checker.checkWindowForTransactions(queryParams.size)).resolves.not.toThrowError('Complexity exceeded threshold 10000.');
    });
  });

  describe('Response Format Validation', () => {
    it('should check response body for a list of transactions available on the blockchain', async () => {
      const checker = new ApiChecker('transactions', app.getHttpServer());
      await expect(checker.checkTransactionsResponseBody()).resolves.not.toThrowError('Invalid response body for transactions!');
    });
  });

  describe('Error Handling Tests', () => {
    it('should handle complexity exceeded', async () => {
      const queryParams = {
        size: 60,
        withOperations: true,
        withLogs: true,
        withScResults: true
      };
      const checker = new ApiChecker(`transactions?size=${queryParams.size}&withOperations=${queryParams.withOperations}&withLogs=${queryParams.withLogs}&withScResults=${queryParams.withScResults}`, app.getHttpServer());
      await expect(checker.checkWindowForTransactions(queryParams.size)).rejects.toThrowError('Complexity exceeded threshold 10000.');
    });
  });
});
