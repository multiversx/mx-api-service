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

  it("should check accounts pagination", async () => {
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

  describe("Error Handling Tests", () => {

    it('should handle invalid data format for ownerAddress parameter', async () => {
      const checker = new ApiChecker('accounts?ownerAddress=badAddress', app.getHttpServer());
      try {
        await checker.checkStatus();
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        console.log('Bad request.');
      }
    });

    it('should handle invalid size of result window', async () => {
      const checker = new ApiChecker('accounts?from=30&size=9975', app.getHttpServer());
      try {
        await checker.checkStatus();
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        console.log('Result window is too large, from + size must be less than or equal to: [10000].');
      }
    });

    it("should handle invalid body response for an account search by an invalid owner address ", async () => {

      const checker = new ApiChecker('accounts?ownerAddress=erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqplllst77y4l', app.getHttpServer());

      try {
        await checker.checkAccountResponseBody();
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        console.log('Bad request.');
      }

    });

  })

  describe("Rate Limit Testing", () => {
    //The maximum complexity available is currently hardcoded at 10000
    it('should check maximum number of items to retrieve: size number', async () => {
      const checker = new ApiChecker('accounts?size=10000', app.getHttpServer());
      try {
        await checker.checkStatus();
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        console.log('Result window is too large, from + size must be less than or equal to: [10000].');
      }
    });

    //Requests that return multiple items will be paginated to 25 items by default. So, if the number of items to retrieve is not set, it will be set at 25 by default.
    it('should check maximum number of items to skip for the result set: from number', async () => {
      const checker = new ApiChecker('accounts?from=9975', app.getHttpServer());
      try {
        await checker.checkStatus();
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        console.log('Result window is too large, from + size must be less than or equal to: [10000].');
      }
    });

    it('should check maximum number of items to skip and to retrive for the result set: form + size numbers', async () => {
      const checker = new ApiChecker('accounts?from=25&size=9975', app.getHttpServer());
      try {
        await checker.checkStatus();
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        console.log('Result window is too large, from + size must be less than or equal to: [10000].');
      }
    });

  })

  describe("Response Format Validation", () => {

    it("should check data response format for accounts details of account searched by a valid owner address", async () => {

      const checker = new ApiChecker('accounts?ownerAddress=erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqplllst77y4l', app.getHttpServer());

      await checker.checkAccountResponseBody();

    });

  })

  describe("Concurrent Testing", () => {

    it('should check accounts count of an owner', async () => {
      const checker = new ApiChecker('accounts/?ownerAddress=erd1ss6u80ruas2phpmr82r42xnkd6rxy40g9jl69frppl4qez9w2jpsqj8x97', app.getHttpServer());
      checker.skipFields = skipedFields;

      const queryParams = {
        ownerAddress: 'erd1ss6u80ruas2phpmr82r42xnkd6rxy40g9jl69frppl4qez9w2jpsqj8x97',
      };

      await checker.checkAlternativeCount(queryParams);
    });

    it('should check accounts details  for a given address', async () => {
      const checker = new ApiChecker('accounts', app.getHttpServer());

      const address: string = "erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqplllst77y4l";

      checker.skipFields = skipedFields;
      await checker.checkAccountDetails(address);
    });

    it('should check the sorting of the accounts according to the sort accounts criterias ', async () => {
      const checker = new ApiChecker('accounts', app.getHttpServer());

      const sort = ['balance', 'timestamp'];

      await checker.checkFilter(sort);
    });

  })

});
