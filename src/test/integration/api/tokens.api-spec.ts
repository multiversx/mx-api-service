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

  const skipedFields = ['error', 'message', 'statusCode'];

  afterAll(async () => {
    await app.close();
  });

  it("should check tokens pagination", async () => {
    const checker = new ApiChecker('tokens', app.getHttpServer());
    checker.skipFields = skipedFields;
    await checker.checkPagination();
  });

  it('should check tokens status response code', async () => {
    const checker = new ApiChecker('tokens', app.getHttpServer());
    checker.skipFields = skipedFields;
    await checker.checkStatus();
  });

  it('should check tokens count', async () => {
    const checker = new ApiChecker('tokens', app.getHttpServer());
    checker.skipFields = skipedFields;
    await checker.checkAlternativeCount();
  });
});
