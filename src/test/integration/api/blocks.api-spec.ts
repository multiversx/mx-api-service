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

  const skipedFields = ['scheduledRootHash'];
  const randomShard = Math.floor(Math.random() * 3);

  afterAll(async () => {
    await app.close();
  });

  describe('/blocks', () => {
    it('should check blocks pagination', async () => {
      const checker = new ApiChecker('blocks', app.getHttpServer());
      checker.defaultParams = { epoch: 500, shard: randomShard };
      checker.skipFields = skipedFields;
      await checker.checkPagination();
    });

    it('should handle pagination error', async () => {
      const checker = new ApiChecker('blocks', app.getHttpServer());
      checker.defaultParams = { epoch: 500, shard: randomShard };
      checker.skipFields = skipedFields;
      await checker.checkPaginationError();
    });

    it('should check blocks status response code', async () => {
      const checker = new ApiChecker('blocks', app.getHttpServer());
      checker.defaultParams = { epoch: 500, shard: randomShard };
      checker.skipFields = skipedFields;
      await checker.checkStatus();
    });

    it('should check response body for all blocks from all shards', async () => {
      const checker = new ApiChecker('blocks', app.getHttpServer());
      checker.skipFields = skipedFields;
      await expect(checker.checkArrayResponseBody()).resolves.not.toThrowError('Invalid response body!');
    });

    it('should not exceed rate limit', async () => {
      const checker = new ApiChecker('blocks', app.getHttpServer());
      checker.defaultParams = { epoch: 500, shard: randomShard };
      await expect(checker.checkRateLimit()).resolves.not.toThrowError('Exceed rate limit for parallel requests!');
    });
  });

  describe('/blocks/count', () => {
    it('should check blocks count', async () => {
      const checker = new ApiChecker('blocks', app.getHttpServer());
      checker.defaultParams = { epoch: 500, shard: randomShard };
      checker.skipFields = skipedFields;
      await checker.checkAlternativeCount();
    });
  });

  describe('/blocks/latest', () => {
    it('should check status response code for latest block information details', async () => {
      const checker = new ApiChecker('blocks/latest', app.getHttpServer());
      await checker.checkStatus();
    });
  });

  describe('/blocks/{hash}', () => {
    it('should check blocks/{hash} status response code', async () => {
      const hash: string = '6e206540a8567c9113de2517ae073a765c9be49e6e41d6310256e656c6bf9a7d';
      const checker = new ApiChecker(`blocks/${hash}`, app.getHttpServer());
      checker.skipFields = skipedFields;
      await checker.checkStatus();
    });

    it('should handle invalid data for a given hash', async () => {
      const hash: string = '11';
      const checker = new ApiChecker(`blocks/${hash}`, app.getHttpServer());
      await expect(checker.checkStatus()).rejects.toThrowError('Endpoint status code 400');
    });
  });
});
