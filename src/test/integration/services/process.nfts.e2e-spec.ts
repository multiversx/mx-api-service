import { Test } from '@nestjs/testing';
import { Nft } from 'src/endpoints/nfts/entities/nft';
import { NftType } from 'src/endpoints/nfts/entities/nft.type';
import { NftService } from 'src/endpoints/nfts/nft.service';
import { NftWorkerService } from 'src/queue.worker/nft.worker/nft.worker.service';
import { ProcessNftsModule } from 'src/endpoints/process-nfts/process.nfts.module';
import { QueryPagination } from 'src/common/entities/query.pagination';
import { NftFilter } from 'src/endpoints/nfts/entities/nft.filter';
import { ApiConfigService } from 'src/common/api-config/api.config.service';
import { Constants } from '@elrondnetwork/erdnest';
import { NftQueryOptions } from 'src/endpoints/nfts/entities/nft.query.options';
import { ProcessNftsService } from 'src/endpoints/process-nfts/process.nfts.service';
import { ProcessNftSettings } from 'src/endpoints/process-nfts/entities/process.nft.settings';
import nftCollection from 'src/test/data/esdt/nft/nft.example';

describe('Process Nft Service', () => {
  let processNftService: ProcessNftsService;

  const identifier: Nft = {
    identifier: 'EROBOT-527a29-c4',
    collection: 'EROBOT-527a29',
    timestamp: 1645784238,
    attributes: 'dGFnczpFbHJvbmQsIFJvYm90cywgUm9ib3QsIGVSb2JvdHM7bWV0YWRhdGE6UW1lRHhBTlQzOUs4VWdRbzRGWFF4SkdKWURYTVVYZ2dNVlRNY1VBWnpuTnM2cS80MzEuanNvbg==',
    nonce: 196,
    type: NftType.NonFungibleESDT,
    name: 'Elrond Robots #196',
    creator: 'erd1qqqqqqqqqqqqqpgqlxyw866pd8pvfqvphgsz9dgx5mr44uv5ys5sew4epr',
    royalties: 10,
    uris: [
      'aHR0cHM6Ly9pcGZzLmlvL2lwZnMvUW1lRHhBTlQzOUs4VWdRbzRGWFF4SkdKWURYTVVYZ2dNVlRNY1VBWnpuTnM2cS80MzEucG5n',
      'aHR0cHM6Ly9pcGZzLmlvL2lwZnMvUW1lRHhBTlQzOUs4VWdRbzRGWFF4SkdKWURYTVVYZ2dNVlRNY1VBWnpuTnM2cS80MzEuanNvbg==',
      'aHR0cHM6Ly9pcGZzLmlvL2lwZnMvUW1lRHhBTlQzOUs4VWdRbzRGWFF4SkdKWURYTVVYZ2dNVlRNY1VBWnpuTnM2cS9jb2xsZWN0aW9uLmpzb24=',
    ],
    url: 'https://media.elrond.com/nfts/asset/QmeDxANT39K8UgQo4FXQxJGJYDXMUXggMVTMcUAZznNs6q/431.png',
    media: [
      {
        url: 'https://media.elrond.com/nfts/thumbnail/default.png',
        originalUrl: 'https://media.elrond.com/nfts/thumbnail/default.png',
        thumbnailUrl: 'https://media.elrond.com/nfts/thumbnail/default.png',
        fileType: 'image/png',
        fileSize: 29512,
      },
    ],
    isWhitelistedStorage: true,
    thumbnailUrl: '',
    tags: ['elrond', ' robots', ' robot', ' erobots'],
    metadata: undefined,
    owner: 'erd13w5hlehc42zvhd9u78ylrac9axntn9p9jqn9kvy3c052l8rmt2yqa59l76',
    balance: undefined,
    supply: '1',
    decimals: undefined,
    ticker: 'EROBOT-527a29',
    scamInfo: undefined,
    assets: undefined,
    score: undefined,
    isNsfw: undefined,
    rank: undefined,
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [ProcessNftsModule],
    }).compile();

    processNftService = moduleRef.get<ProcessNftsService>(ProcessNftsService);

  }, Constants.oneHour() * 1000);

  beforeEach(() => { jest.restoreAllMocks(); });

  describe("processNft", () => {
    it("should force refresh media", async () => {

      jest.spyOn(NftService.prototype, 'getSingleNft')
        // eslint-disable-next-line require-await
        .mockImplementation(jest.fn(async (_identifier) => identifier));

      jest.spyOn(NftWorkerService.prototype, 'addProcessNftQueueJob')
        // eslint-disable-next-line require-await
        .mockImplementation(jest.fn(async (_nft: Nft, _settings: ProcessNftSettings) => true));

      const filter = new ProcessNftSettings();
      filter.forceRefreshMedia = true;
      const nft: string = 'EROBOT-527a29-c4';
      const process = await processNftService.processNft(nft, filter);

      expect(process).toBeTruthy();
    });

    it("should force refresh metadata", async () => {
      jest.spyOn(NftService.prototype, 'getSingleNft')
        // eslint-disable-next-line require-await
        .mockImplementation(jest.fn(async (_identifier) => identifier));

      jest.spyOn(NftWorkerService.prototype, 'addProcessNftQueueJob')
        // eslint-disable-next-line require-await
        .mockImplementation(jest.fn(async (_nft: Nft, _settings: ProcessNftSettings) => true));

      const filter = new ProcessNftSettings();
      filter.forceRefreshMetadata = true;
      const nft: string = 'EROBOT-527a29-c4';
      const process = await processNftService.processNft(nft, filter);

      expect(process).toBeTruthy();
    });

    it("should force refresh thumbnail", async () => {
      jest.spyOn(NftService.prototype, 'getSingleNft')
        // eslint-disable-next-line require-await
        .mockImplementation(jest.fn(async (_identifier) => identifier));

      jest.spyOn(NftWorkerService.prototype, 'addProcessNftQueueJob')
        // eslint-disable-next-line require-await
        .mockImplementation(jest.fn(async (_nft: Nft, _settings: ProcessNftSettings) => true));


      const filter = new ProcessNftSettings();
      filter.forceRefreshThumbnail = true;
      const nft: string = 'EROBOT-527a29-c4';
      const process = await processNftService.processNft(nft, filter);

      expect(process).toBeTruthy();
    });

    it("should skip refresh thumbnail", async () => {
      jest.spyOn(NftService.prototype, 'getSingleNft')
        // eslint-disable-next-line require-await
        .mockImplementation(jest.fn(async (_identifier) => identifier));

      jest.spyOn(NftWorkerService.prototype, 'addProcessNftQueueJob')
        // eslint-disable-next-line require-await
        .mockImplementation(jest.fn(async (_nft: Nft, _settings: ProcessNftSettings) => true));


      const filter = new ProcessNftSettings();
      filter.skipRefreshThumbnail = true;
      const nft: string = 'EROBOT-527a29-c4';
      const process = await processNftService.processNft(nft, filter);

      expect(process).toBeTruthy();
    });
  });

  describe("processCollection", () => {
    it("should process collection", async () => {
      jest.spyOn(NftService.prototype, 'getNfts')
        // eslint-disable-next-line require-await
        .mockImplementation(jest.fn(async (_queryPagination: QueryPagination, _filter: NftFilter, _queryOptions?: NftQueryOptions) => nftCollection));

      jest.spyOn(ApiConfigService.prototype, 'getPoolLimit')
        // eslint-disable-next-line require-await
        .mockImplementation(jest.fn(() => 100));

      const filter = new ProcessNftSettings();
      filter.skipRefreshThumbnail = true;

      const collection: string = "EROBOT-527a29";
      const process = await processNftService.processCollection(collection, filter);

      expect(process).toStrictEqual({ "EROBOT-527a29-c4": true });
    });
  });
});
