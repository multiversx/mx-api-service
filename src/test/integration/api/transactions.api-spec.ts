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

  describe("Rate Limit Testing", () => {
    //withScResults will multiply the number of items with 200, thus limiting the maximum requested size to 50
    it('should check a list of transactions available on the blockchain with  the maximum requested size=50', async () => {
      const checker = new ApiChecker('transactions?size=50&withScResults=true', app.getHttpServer());
      try {
        await checker.checkStatus();
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        console.log('Complexity 10400 exceeded threshold 10000.');
      }
    });

    it('should check a list of transactions available on the blockchain with  the maximum requested size=50 and some fields', async () => {
      const checker = new ApiChecker('transactions?size=50&withOperations=true&withLogs=true&withScResults=true', app.getHttpServer());
      try {
        await checker.checkStatus();
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        console.log('Complexity 10400 exceeded threshold 10000.');
      }
    });

  });


  describe("Error Handling Tests", () => {

    it('should handle complexity exceeded ', async () => {
      const checker = new ApiChecker('transactions?size=55&withScResults=true', app.getHttpServer());
      try {
        await checker.checkStatus();
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        console.log('Complexity 10400 exceeded threshold 10000.');
      }
    });

  })


});
