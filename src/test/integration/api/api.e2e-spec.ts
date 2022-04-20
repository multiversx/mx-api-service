import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { CleanupInterceptor } from 'src/interceptors/cleanup.interceptor';
import { FieldsInterceptor } from 'src/interceptors/fields.interceptor';
import { PublicAppModule } from 'src/public.app.module';
import { ApiChecker } from './api.checker';

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
    checker.defaultParams = { epoch: 500 };
    await checker.checkPagination();
    await checker.checkDetails();
    await checker.checkFilter(['shard', 'epoch', 'nonce']);
  });

  it("/accounts", async () => {
    const checker = new ApiChecker('accounts', app.getHttpServer());
    checker.skipFields = ['balance', 'nonce'];
    await checker.checkPagination();
    await checker.checkDetails();
  });

  it("/collections", async () => {
    const checker = new ApiChecker('collections', app.getHttpServer());
    await checker.checkPagination();
    await checker.checkDetails();
    await checker.checkFilter(['type']);
  });
});
