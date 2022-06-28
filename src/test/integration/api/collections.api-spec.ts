import { CleanupInterceptor, FieldsInterceptor } from '@elrondnetwork/nestjs-microservice-common';
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
      new FieldsInterceptor(),
      new CleanupInterceptor(),
    );
    await app.init();
  });

  it("/collections", async () => {
    const checker = new ApiChecker('collections', app.getHttpServer());
    await checker.checkStatus();
    await checker.checkPagination();
    await checker.checkDetails();
    await checker.checkFilter(['type']);
    await checker.checkAlternativeCount(['type']);
  });
});
