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

  afterAll(async () => {
    await app.close();
  });

  it("should check collections pagination", async () => {
    const checker = new ApiChecker('collections', app.getHttpServer());
    await checker.checkPagination();
  });

  it('should check collections status response code', async () => {
    const checker = new ApiChecker('collections', app.getHttpServer());
    await checker.checkStatus();
  });

  it('should check collections count', async () => {
    const checker = new ApiChecker('collections', app.getHttpServer());
    await checker.checkAlternativeCount();
  });

  it('should check collections details', async () => {
    const checker = new ApiChecker('collections', app.getHttpServer());
    await checker.checkDetails();
  });

  describe("Response Format Validation", () => {

    it('should check the response body: should return 25 collections', async () => {
      const checker = new ApiChecker('collections', app.getHttpServer());
      await checker.checkResponseBodyDefault();
    });

  })

});
