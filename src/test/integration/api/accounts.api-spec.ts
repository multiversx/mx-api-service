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
});
