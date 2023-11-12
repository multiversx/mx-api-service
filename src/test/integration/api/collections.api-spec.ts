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

  describe('Error Handling Tests', () => {
    it('should handle invalid type parameter', async () => {
      const checker = new ApiChecker('collections', app.getHttpServer());
      const type = 'type';
      const value = 'aaa';
      await expect(checker.checkType(type, value)).rejects.toThrowError("Validation failed for argument 'type' (one of the following values is expected: NonFungibleESDT, SemiFungibleESDT, MetaESDT).");
    });
  });

  describe('Response Format Validation', () => {
    it('should check the response body: should return 25 collections', async () => {
      const checker = new ApiChecker('collections', app.getHttpServer());
      await checker.checkResponseBodyDefault();
    });

    it('should check response body for non-fungible/semi-fungible/meta-esdt collections', async () => {
      const checker = new ApiChecker('collections', app.getHttpServer());
      await expect(checker.checkCollectionsResponseBody()).resolves.not.toThrowError('Invalid response body for collections!');
    });

    it('should check type parameter', async () => {
      const checker = new ApiChecker('collections', app.getHttpServer());
      const type = 'type';
      const value = 'NonFungibleESDT';
      await expect(checker.checkType(type, value)).resolves.not.toThrowError("Validation failed for argument 'type' (one of the following values is expected: NonFungibleESDT, SemiFungibleESDT, MetaESDT).");
    });
  });

  describe('Concurrent Testing', () => {
    it('should check sorting of the collections according to the sorting criterias ', async () => {
      const checker = new ApiChecker('collections', app.getHttpServer());
      const sortCriterias = ['timestamp'];
      const promises = sortCriterias.map(async (sort) => {
        await checker.checkFilter([sort]);
      });
      await Promise.all(promises);
    });

    it('should check collections filtered by type (NonFungibleESDT/SemiFungibleESDT/MetaESDT).', async () => {
      const checker = new ApiChecker('collections', app.getHttpServer());
      const type = 'type';
      const typesCriterias = ['NonFungibleESDT', 'SemiFungibleESDT', 'MetaESDT'];
      const promise1 = Promise.resolve(checker.checkType(type, typesCriterias[0]));
      const promise2 = Promise.resolve(checker.checkType(type, typesCriterias[1]));
      const promise3 = Promise.resolve(checker.checkType(type, typesCriterias[2]));
      await Promise.all([promise1, promise2, promise3]);
    });
  });
});
