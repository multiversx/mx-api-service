import { QueryConditionOptions } from 'src/common/elastic/entities/query.condition.options';
import { ElasticQuery } from 'src/common/elastic/entities/elastic.query';
import { ElasticService } from 'src/common/elastic/elastic.service';
import { PublicAppModule } from 'src/public.app.module';
import { Test } from '@nestjs/testing';
import Initializer from './e2e-init';

describe('Elastic Service', () => {
  let elasticService: ElasticService;

  beforeAll(async () => {
    await Initializer.initialize();

    const moduleRef = await Test.createTestingModule({
      imports: [PublicAppModule],
    }).compile();

    elasticService = moduleRef.get<ElasticService>(ElasticService);

  });

  describe("getAccountEsdtByAddressCount", () => {
    it("should return count number of esdt for address", async () => {
      const address: string = "erd12qx84kstcvuek9hyya8dx0w57dym7fedakyzd0qqf5fatdej34ysl067at";
      const count = await elasticService.getAccountEsdtByAddressCount(address);

      expect(typeof count).toBe('number');
    });
  });

  describe("getLogsForTransactionHashes", () => {
    it("should log for transactions hashes with Pagination, Condition ", async () => {
      const queries: any = [];
      const elasticQueryLogs = ElasticQuery.create()
        .withPagination({ from: 0, size: 100 })
        .withCondition(QueryConditionOptions.should, queries);

      const transactions = await elasticService.getLogsForTransactionHashes(elasticQueryLogs);

      for (const transaction of transactions) {
        expect(transaction).toBeInstanceOf(Object);
        expect(transaction.hasOwnProperty("_index")).toBeTruthy();
        expect(transaction.hasOwnProperty("_type")).toBeTruthy();
        expect(transaction.hasOwnProperty("_score")).toBeTruthy();
        expect(transaction.hasOwnProperty("_source")).toBeTruthy();
        expect(transaction.hasOwnProperty("_id")).toBeTruthy();
      }
    });
  });

  describe("getAccountEsdtByAddress", () => {
    it("should return esdt account with length 1", async () => {
      const esdtIdentifier: string = "AZTECNFT-74390f";
      const accounts = await elasticService.getAccountEsdtByIdentifier(esdtIdentifier, { from: 0, size: 1 });

      expect(accounts).toHaveLength(1);

      for (const account of accounts) {
        expect(account.hasOwnProperty("identifier")).toBeTruthy();
        expect(account.hasOwnProperty("address")).toBeTruthy();
        expect(account.hasOwnProperty("balance")).toBeTruthy();
        expect(account.hasOwnProperty("token")).toBeTruthy();
      }
    });

    it("should return esdt account with length 10", async () => {
      const esdtIdentifier: string = "AZTECNFT-74390f";
      const accounts = await elasticService.getAccountEsdtByIdentifier(esdtIdentifier, { from: 0, size: 10 });

      expect(accounts).toHaveLength(10);
    });
  });

  describe("getAccountEsdtByAddressesAndIdentifier", () => {
    it("should return account esdt based on identifier and address", async () => {
      const esdtIdentifier: string = "AZTECNFT-74390f";
      const address: string[] = ["erd1xej08rqdg4ja0q38m2fxgy7mdsmvjnrzn4zxslzmg6shrc9scdyqzw8yur"];
      const accounts = await elasticService.getAccountEsdtByAddressesAndIdentifier(esdtIdentifier, address);

      for (const account of accounts) {
        expect(account.hasOwnProperty("identifier")).toBeTruthy();
        expect(account.hasOwnProperty("address")).toBeTruthy();
        expect(account.hasOwnProperty("balance")).toBeTruthy();
        expect(account.hasOwnProperty("token")).toBeTruthy();
      }
    });
  });

  describe("getAccountEsdtByIdentifiers", () => {
    it("should return account esdt by identifiers", async () => {
      const identifiers: string[] = ["NFTO-f84d3a-04", "NFTO-f84d3a-03"];
      const results = await elasticService.getAccountEsdtByIdentifiers(identifiers);

      for (const result of results) {
        expect(result.hasOwnProperty("identifier")).toBeTruthy();
        expect(result.hasOwnProperty("address")).toBeTruthy();
        expect(result.hasOwnProperty("balance")).toBeTruthy();
        expect(result.hasOwnProperty("token")).toBeTruthy();
      }
    });

    it("should return null if identifiers are not defined", async () => {
      const identifiers: string[] = [];
      const results = await elasticService.getAccountEsdtByIdentifiers(identifiers);

      expect(results).toStrictEqual([]);
    });
  });
});
