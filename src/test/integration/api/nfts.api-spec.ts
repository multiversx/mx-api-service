import { CleanupInterceptor, FieldsInterceptor } from '@multiversx/sdk-nestjs-http';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PublicAppModule } from 'src/public.app.module';
import { ApiChecker } from 'src/utils/api.checker';

describe.skip("API Testing", () => {
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

  const skipedFields = ['message', 'statusCode'];

  afterAll(async () => {
    await app.close();
  });

  it("should check nfts pagination", async () => {
    const checker = new ApiChecker('nfts', app.getHttpServer());
    checker.skipFields = skipedFields;
    await checker.checkPagination();
  });

  it('should check nfts status response code', async () => {
    const checker = new ApiChecker('nfts', app.getHttpServer());
    checker.skipFields = skipedFields;
    await checker.checkStatus();
  });

  it('should check nfts count', async () => {
    const checker = new ApiChecker('nfts', app.getHttpServer());
    checker.skipFields = skipedFields;
    await checker.checkAlternativeCount();
  });
});
