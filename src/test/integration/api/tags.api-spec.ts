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
      // @ts-ignore
      new FieldsInterceptor(),
      new CleanupInterceptor(),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it("should check tags pagination", async () => {
    const checker = new ApiChecker('tags', app.getHttpServer());
    await checker.checkPagination();
  });

  it('should check tags status response code', async () => {
    const checker = new ApiChecker('tags', app.getHttpServer());
    await checker.checkStatus();
  });

  it('should handle valid data', async () => {
    const checker = new ApiChecker('tags/sunny', app.getHttpServer());
    await checker.checkStatus();
  });

  describe("Response Format Validation", () => {

    it("should check data response format for a tag search by tag name ", async () => {

      const checker = new ApiChecker('tags?search=sunny', app.getHttpServer());
      await checker.checkTagsResponseBody();

    });

  });

  describe("Error Handling Tests", () => {

    it('should handle invalid data', async () => {
      const checker = new ApiChecker('tags/aa', app.getHttpServer());
      try {
        await checker.checkStatus();
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        console.log('Nft tag not found.');
      }
    });

  });

});
