import { INestApplication } from "@nestjs/common";
import { mockScResultsService } from "./services.mock/scresults.services.mock";
import { Test, TestingModule } from "@nestjs/testing";
import { SmartContractResultController } from "src/endpoints/sc-results/scresult.controller";
import { SmartContractResultService } from "src/endpoints/sc-results/scresult.service";
import request = require('supertest');
import { QueryPagination } from "src/common/entities/query.pagination";
import { SmartContractResultFilter } from "src/endpoints/sc-results/entities/smart.contract.result.filter";
import { ConfigModule } from "@nestjs/config";
import { PublicAppModule } from "src/public.app.module";
import { SmartContractResultOptions } from "src/endpoints/sc-results/entities/smart.contract.result.options";
import { PoolService } from "src/endpoints/pool/pool.service";
import { mockPoolService } from "./services.mock/pool.services.mock";

describe('CollectionController', () => {
  let app: INestApplication;
  const path = '/results';
  const scResultsServiceMocks = mockScResultsService();
  const poolServiceMocks = mockPoolService();

  beforeEach(async () => {
    jest.resetAllMocks();
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [SmartContractResultController],
      imports: [PublicAppModule,
        ConfigModule.forRoot({}),
      ],
    })
      .overrideProvider(SmartContractResultService).useValue(scResultsServiceMocks)
      .overrideProvider(PoolService).useValue(poolServiceMocks)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  describe('GET /results', () => {
    it('should return a list of smart contract results', async () => {
      scResultsServiceMocks.getScResults.mockResolvedValue([]);

      await request(app.getHttpServer())
        .get(`${path}`)
        .expect(200);

      expect(scResultsServiceMocks.getScResults).toHaveBeenCalled();
      expect(scResultsServiceMocks.getScResults).toHaveBeenCalledWith(
        new QueryPagination({ from: 0, size: 25 }),
        new SmartContractResultFilter({}),
        new SmartContractResultOptions({})
      );
    });

    it('should return a list of smart contract results with filters applied', async () => {
      scResultsServiceMocks.getScResults.mockResolvedValue([]);
      const miniBlockHash = '427cb50ca62b2820b88762f01076c44a88399b4ca6f012392a6993167d6db71b';
      const originalTxHashes = ['a2657998bdbdbeece49370822155c9144c1f13c85b912d158a518bd10fba86aa'];

      await request(app.getHttpServer())
        .get(`${path}?miniBlockHash=${miniBlockHash}&originalTxHashes=${originalTxHashes}`)
        .expect(200);

      expect(scResultsServiceMocks.getScResults).toHaveBeenCalled();
      expect(scResultsServiceMocks.getScResults).toHaveBeenCalledWith(
        new QueryPagination({ from: 0, size: 25 }),
        new SmartContractResultFilter({ miniBlockHash, originalTxHashes }),
        new SmartContractResultOptions({})
      );
    });
  });

  describe('GET /results/count', () => {
    it('should return smart contract results count', async () => {
      scResultsServiceMocks.getScResultsCount.mockResolvedValue(5000);

      await request(app.getHttpServer())
        .get(`${path}/count`)
        .expect(200)
        .expect(response => {
          expect(+response.text).toStrictEqual(5000);
        });

      expect(scResultsServiceMocks.getScResultsCount).toHaveBeenCalled();
    });
  });

  describe('GET /results/:scHash', () => {
    it('should return smart contract results details', async () => {
      scResultsServiceMocks.getScResult.mockResolvedValue({});
      const scHash = 'ac7f90ddf935f23efa0e7a69f73b10ead9f6b07cae48eb16cf0a28dfc571d1c2';
      await request(app.getHttpServer())
        .get(`${path}/${scHash}`)
        .expect(200);

      expect(scResultsServiceMocks.getScResult).toHaveBeenCalledWith(scHash);
    });

    it('should throw 404 Smart contract result not found', async () => {
      scResultsServiceMocks.getScResult.mockResolvedValue(undefined);
      const scHash = 'ac7f90ddf935f23efa0e7a69f73b10ead9f6b07cae48eb16cf0a28dfc571d1c2';
      await request(app.getHttpServer())
        .get(`${path}/${scHash}`)
        .expect(404)
        .expect(response => {
          expect(response.body.message).toStrictEqual('Smart contract result not found');
        });
      expect(scResultsServiceMocks.getScResult).toHaveBeenCalledWith(scHash);
    });

    it('should throw 400 Bad Request for a invalid scHash', async () => {
      scResultsServiceMocks.getScResult.mockResolvedValue(undefined);
      const scHash = 'invalid-scHash';
      await request(app.getHttpServer())
        .get(`${path}/${scHash}`)
        .expect(400)
        .expect(response => {
          expect(response.body.message).toStrictEqual("Validation failed for transaction hash 'scHash'. Length should be 64.");
        });
    });
  });
});
