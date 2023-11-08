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

  it("should check blocks pagination", async () => {
    const checker = new ApiChecker('blocks', app.getHttpServer());

    checker.defaultParams = { epoch: 500, shard: randomShard };
    checker.skipFields = skipedFields;

    await checker.checkPagination();
  });

  it('should check blocks status response code', async () => {
    const checker = new ApiChecker('blocks', app.getHttpServer());

    checker.defaultParams = { epoch: 500, shard: randomShard };
    checker.skipFields = skipedFields;
    await checker.checkStatus();
  });

  it('should check blocks count', async () => {
    const checker = new ApiChecker('blocks', app.getHttpServer());

    checker.defaultParams = { epoch: 500, shard: randomShard };
    checker.skipFields = skipedFields;
    await checker.checkAlternativeCount();
  });

  describe("Error Handling Tests", () => {

    it('should handle invalid data for a given hash', async () => {
      const checker = new ApiChecker('blocks/11', app.getHttpServer());
      try {
        await checker.checkStatus();
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        console.log('Bad request.');
      }
    });

  })

  describe("Response Format Validation", () => {

    it('should check the response body: should return 25 blocks details from all shards ', async () => {
      const checker = new ApiChecker('blocks', app.getHttpServer());

      checker.defaultParams = { epoch: 500, shard: randomShard };
      await checker.checkResponseBodyDefault();
    });

    it('should check the count of all blocks from all shards ', async () => {
      const checker = new ApiChecker('blocks/count', app.getHttpServer());

      checker.defaultParams = { epoch: 500, shard: randomShard };
      await checker.checkTotalCountOfAllBlocksResponseBody();
    });

  })

  describe("Concurrent Testing", () => {

    it('should check the sorting of the blocks according to the "withProposerIdentity" filter', async () => {
      const checker = new ApiChecker('blocks', app.getHttpServer());

      checker.defaultParams = { epoch: 500, shard: randomShard };
      await checker.checkFilterValueInternal('withProposerIdentity', 'true');
    });

  })

});
