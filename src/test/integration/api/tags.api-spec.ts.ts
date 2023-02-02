import { CleanupInterceptor, FieldsInterceptor } from '@multiversx/sdk-nestjs';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PublicAppModule } from 'src/public.app.module';
import { ApiChecker } from 'src/utils/api.checker';

describe("API Testing", () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [PublicAppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalInterceptors(
      // @ts-ignore
      new FieldsInterceptor(),
      new CleanupInterceptor(),
    );
    await app.init();
  });

  it("/tags", async () => {
    const checker = new ApiChecker('tags', app.getHttpServer());
    await checker.checkStatus();
    await checker.checkPagination();
    await checker.checkDetails();
    await checker.checkStatus();
  });
});
