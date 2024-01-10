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

  const skipedFields = ['receiverAssets'];

  afterAll(async () => {
    await app.close();
  });

  describe('/results', () => {
    it("should check results pagination", async () => {
      const checker = new ApiChecker('results', app.getHttpServer());
      await checker.checkPagination();
    });

    it('should handle exceeding the limit value for "from" and "size" parameters', async () => {
      const fromNumber = 30;
      const sizeNumber = 9975;
      const checker = new ApiChecker(`results?from=${fromNumber}&size=${sizeNumber}`, app.getHttpServer());
      await expect(checker.checkWindow(fromNumber, sizeNumber)).rejects.toThrowError('Result window is too large!');
    });

    it('should check results status response code', async () => {
      const checker = new ApiChecker('results', app.getHttpServer());
      await checker.checkStatus();
    });

    it('should check response body for all smart contract results available on the blockchain', async () => {
      const checker = new ApiChecker(`results`, app.getHttpServer());
      await expect(checker.checkResultsResponseBody()).resolves.not.toThrowError('Invalid response body for results!');
    });

    it('should check results status response code for all smart contract results available on the blockchain, filtered by miniBlockHash', async () => {
      const miniBlockHash: string = '42d07f9cf1d069ee6f39d74cdfb1f9e3b3326c066598fd0f88e523bad44d85b1';
      const checker = new ApiChecker(`results?miniBlockHash=${miniBlockHash}`, app.getHttpServer());
      await checker.checkStatus();
    });

    it('should check results status response code for all smart contract results available on the blockchain, filtered by originalTxHashes', async () => {
      const originalTxHashes: string = 'f708864d802799353743f8703bffc87fa8167e46a522eb973fdfadedaa2bc9e0,90200529834255e1d53bd05a6402e8435745857ded67c193efc60024ba62427e';
      const checker = new ApiChecker(`results?originalTxHashes=${originalTxHashes}`, app.getHttpServer());
      await checker.checkStatus();
    });

    it('should check results details', async () => {
      const checker = new ApiChecker('results', app.getHttpServer());
      checker.skipFields = skipedFields;
      await checker.checkDetails();
    });
  });

  describe('/results/count', () => {
    it('should check results count', async () => {
      const checker = new ApiChecker(`results/count`, app.getHttpServer());
      await checker.checkStatus();
    });
  });

  describe('/results/{scHash}', () => {
    it('should handle valid data', async () => {
      const scHash: string = 'fdbf4c1bf44655ec2403dfb9798ec741049b3a76ae768561b07b2e082e565087';
      const checker = new ApiChecker(`results/${scHash}`, app.getHttpServer());
      await checker.checkStatus();
    });

    it('should handle invalid data', async () => {
      const scHash: string = 'fdbf4c168561b07b2e082e565087';
      const checker = new ApiChecker(`results/${scHash}`, app.getHttpServer());
      await expect(checker.checkStatus()).rejects.toThrowError('Endpoint status code 400');
    });
  });
});
