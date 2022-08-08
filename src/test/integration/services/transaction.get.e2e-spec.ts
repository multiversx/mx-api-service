import { PublicAppModule } from "src/public.app.module";
import { Test } from "@nestjs/testing";
import { TransactionGetService } from "src/endpoints/transactions/transaction.get.service";

describe('Transaction Get Service', () => {
  let transactionGetService: TransactionGetService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [PublicAppModule],
    }).compile();

    transactionGetService = moduleRef.get<TransactionGetService>(TransactionGetService);

  });

  describe("Get Transactions", () => {
    it("should return logs transactions from elastic", async () => {
      const hashes: string[] = [
        "51ffbf3d27e06fd509c510ef0ff1ea7329359dba89c05aeec333de52a405664d",
        "52408e723d6324f27ad1feae0a67610c8f3409e9a7c08cbc0832e9b1b242feae",
        "a406faee819911b772aad2d428acea3f6f933e403e4347db281271ccb83d7655",
      ];

      const results = await transactionGetService.getTransactionLogsFromElastic(hashes);

      for (const result of results) {
        expect(result).toHaveProperty("id");
      }
    });

    it("should return transaction sc results details from elastic", async () => {
      const txHash: string = "51ffbf3d27e06fd509c510ef0ff1ea7329359dba89c05aeec333de52a405664d";
      const results = await transactionGetService.getTransactionScResultsFromElastic(txHash);

      for (const result of results) {
        expect(result.hasOwnProperty("hash")).toBeTruthy();
        expect(result.hasOwnProperty("timestamp")).toBeTruthy();
        expect(result.hasOwnProperty("nonce")).toBeTruthy();
        expect(result.hasOwnProperty("gasLimit")).toBeTruthy();
        expect(result.hasOwnProperty("gasPrice")).toBeTruthy();
        expect(result.hasOwnProperty("value")).toBeTruthy();
        expect(result.hasOwnProperty("sender")).toBeTruthy();
        expect(result.hasOwnProperty("receiver")).toBeTruthy();
        expect(result.hasOwnProperty("data")).toBeTruthy();
        expect(result.hasOwnProperty("prevTxHash")).toBeTruthy();
        expect(result.hasOwnProperty("originalTxHash")).toBeTruthy();
        expect(result.hasOwnProperty("callType")).toBeTruthy();
        expect(result.hasOwnProperty("miniBlockHash")).toBeTruthy();
        expect(result.hasOwnProperty("logs")).toBeTruthy();
        expect(result.hasOwnProperty("returnMessage")).toBeTruthy();
      }
    });

    it("should return transaction from gateway with queryInElastic = true", async () => {
      const txHash: string = "51ffbf3d27e06fd509c510ef0ff1ea7329359dba89c05aeec333de52a405664d";
      const results = await transactionGetService.tryGetTransactionFromGateway(txHash, true);

      if (!results) {
        throw new Error("Properties are not defined");
      }

      expect(results.txHash).toStrictEqual("51ffbf3d27e06fd509c510ef0ff1ea7329359dba89c05aeec333de52a405664d");
      expect(results.receiver).toStrictEqual("erd1qqqqqqqqqqqqqpgqy47ztjxnnqzwg6urd7qqn0ctx579h9kg0y8qn8gpxw");
      expect(results.sender).toStrictEqual("erd1ragf2tu8rkz3mme3m2yx6f33huy8hkwnknm82eg8s2zdpgy7mwas4d52hm");


      expect(results.logs).toBeDefined();
      expect(results.logs?.address).toStrictEqual("erd1qqqqqqqqqqqqqpgqy47ztjxnnqzwg6urd7qqn0ctx579h9kg0y8qn8gpxw");
    });

    it("should return transaction from gateway with queryInElastic = false", async () => {
      const txHash: string = "51ffbf3d27e06fd509c510ef0ff1ea7329359dba89c05aeec333de52a405664d";
      const results = await transactionGetService.tryGetTransactionFromGateway(txHash, false);

      if (!results) {
        throw new Error("Properties are not defined");
      }

      expect(results.txHash).toStrictEqual("51ffbf3d27e06fd509c510ef0ff1ea7329359dba89c05aeec333de52a405664d");
      expect(results.receiver).toStrictEqual("erd1qqqqqqqqqqqqqpgqy47ztjxnnqzwg6urd7qqn0ctx579h9kg0y8qn8gpxw");
      expect(results.sender).toStrictEqual("erd1ragf2tu8rkz3mme3m2yx6f33huy8hkwnknm82eg8s2zdpgy7mwas4d52hm");


      expect(results.logs).toBeDefined();
      expect(results.logs?.address).toStrictEqual("erd1qqqqqqqqqqqqqpgqy47ztjxnnqzwg6urd7qqn0ctx579h9kg0y8qn8gpxw");
    });
  });
});
