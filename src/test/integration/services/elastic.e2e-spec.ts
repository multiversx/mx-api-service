import { PublicAppModule } from 'src/public.app.module';
import { Test } from '@nestjs/testing';
import Initializer from './e2e-init';
import { NftService } from 'src/endpoints/nfts/nft.service';
import { EsdtService } from 'src/endpoints/esdt/esdt.service';

describe('Elastic Service', () => {
  let nftService: NftService;
  let esdtService: EsdtService;

  beforeAll(async () => {
    await Initializer.initialize();

    const moduleRef = await Test.createTestingModule({
      imports: [PublicAppModule],
    }).compile();

    nftService = moduleRef.get<NftService>(NftService);
    esdtService = moduleRef.get<EsdtService>(EsdtService);
  });

  describe("getAccountEsdtByAddress", () => {
    it("should return esdt account with length 1", async () => {
      const esdtIdentifier: string = "AZTECNFT-74390f";
      const accounts = await nftService.getAccountEsdtByIdentifier(esdtIdentifier, { from: 0, size: 1 });

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
      const accounts = await nftService.getAccountEsdtByIdentifier(esdtIdentifier, { from: 0, size: 10 });

      expect(accounts).toHaveLength(10);
    });
  });

  describe("getAccountEsdtByAddressesAndIdentifier", () => {
    it("should return account esdt based on identifier and address", async () => {
      const esdtIdentifier: string = "AZTECNFT-74390f";
      const address: string[] = ["erd1xej08rqdg4ja0q38m2fxgy7mdsmvjnrzn4zxslzmg6shrc9scdyqzw8yur"];
      const accounts = await esdtService.getAccountEsdtByAddressesAndIdentifier(esdtIdentifier, address);

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
      const results = await nftService.getAccountEsdtByIdentifiers(identifiers);

      for (const result of results) {
        expect(result.hasOwnProperty("identifier")).toBeTruthy();
        expect(result.hasOwnProperty("address")).toBeTruthy();
        expect(result.hasOwnProperty("balance")).toBeTruthy();
        expect(result.hasOwnProperty("token")).toBeTruthy();
      }
    });

    it("should return null if identifiers are not defined", async () => {
      const identifiers: string[] = [];
      const results = await nftService.getAccountEsdtByIdentifiers(identifiers);

      expect(results).toStrictEqual([]);
    });
  });
});
