import { CleanupInterceptor, FieldsInterceptor } from '@multiversx/sdk-nestjs';
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

  it("/blocks", async () => {
    const checker = new ApiChecker('blocks', app.getHttpServer());
    const randomShard = Math.floor(Math.random() * 3);
    checker.defaultParams = { epoch: 500, shard: randomShard };
    checker.skipFields = ['scheduledRootHash'];
    await checker.checkStatus();
    await checker.checkPagination();
    await checker.checkDetails();
    await checker.checkFilter(['shard', 'epoch', 'nonce']);
    await checker.checkAlternativeCount();
  });
});
