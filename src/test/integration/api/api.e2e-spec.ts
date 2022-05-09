import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { CleanupInterceptor } from 'src/interceptors/cleanup.interceptor';
import { FieldsInterceptor } from 'src/interceptors/fields.interceptor';
import { PublicAppModule } from 'src/public.app.module';
import { ApiChecker } from 'src/utils/api.checker.utils';

describe("API Testing", () => {
  let app: INestApplication;

  beforeEach(async () => {
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

  it("/accounts", async () => {
    const checker = new ApiChecker('accounts', app.getHttpServer());
    checker.skipFields = ['balance', 'nonce'];
    await checker.checkPagination();
    await checker.checkDetails();
    await checker.checkStatus();
  });


  it("/blocks", async () => {
    const checker = new ApiChecker('blocks', app.getHttpServer());
    checker.defaultParams = { epoch: 500 };
    await checker.checkPagination();
    await checker.checkDetails();
    await checker.checkFilter(['shard', 'epoch', 'nonce']);
    await checker.checkAlternativeCount(['validator']);
    await checker.checkStatus();
  });

  it("/collections", async () => {
    const checker = new ApiChecker('collections', app.getHttpServer());
    await checker.checkPagination();
    await checker.checkDetails();
    await checker.checkFilter(['type']);
    await checker.checkAlternativeCount(['type']);
    await checker.checkStatus();
  });

  it("/nfts", async () => {
    const checker = new ApiChecker('nfts', app.getHttpServer());
    checker.skipFields = ['message', 'statusCode'];
    await checker.checkFilter(['collection', 'creator']);
    await checker.checkAlternativeCount(['type', 'collection']);
    await checker.checkStatus();
  });

  it("/tags", async () => {
    const checker = new ApiChecker('tags', app.getHttpServer());
    await checker.checkPagination();
    await checker.checkDetails();
    await checker.checkStatus();
  });

  it("/nodes", async () => {
    const checker = new ApiChecker('nodes', app.getHttpServer());
    await checker.checkPagination();
    await checker.checkDetails();
    await checker.checkFilter(['shard']);
    await checker.checkAlternativeCount(['type', 'online']);
    await checker.checkStatus();
  });

  it("/providers", async () => {
    const checker = new ApiChecker('providers', app.getHttpServer());
    // await checker.checkDetails();
    await checker.checkFilter(['identity']);
    await checker.checkStatus();
  });

  it("/rounds", async () => {
    const checker = new ApiChecker('rounds', app.getHttpServer());
    await checker.checkFilter(['epoch', 'shard']);
    await checker.checkAlternativeCount(['shard']);
    await checker.checkStatus();
  });

  it("/sc-results", async () => {
    const checker = new ApiChecker('sc-results', app.getHttpServer());
    await checker.checkPagination();
    await checker.checkStatus();
  });

  it("shards", async () => {
    const checker = new ApiChecker('shards', app.getHttpServer());
    await checker.checkPagination();
    await checker.checkStatus();
  });

  it("tokens", async () => {
    const checker = new ApiChecker('tokens', app.getHttpServer());
    await checker.checkPagination();
    await checker.checkDetails();
    await checker.checkAlternativeCount(['identifier']);
    await checker.checkStatus();
  });

  it("transactions", async () => {
    const checker = new ApiChecker('transactions', app.getHttpServer());
    await checker.checkDetails();
    await checker.checkAlternativeCount(['miniBlockHash']);
    await checker.checkStatus();
  });
});
