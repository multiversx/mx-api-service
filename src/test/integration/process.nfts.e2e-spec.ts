import { ProcessNftsService } from "../../endpoints/process-nfts/process.nfts.service";
import Initializer from "./e2e-init";
import { Test } from "@nestjs/testing";
import { PublicAppModule } from "../../public.app.module";
import { Constants } from "../../utils/constants";
import { ProcessNftSettings } from "../../endpoints/process-nfts/entities/process.nft.settings";
import { ProcessNftsModule } from "../../endpoints/process-nfts/process.nfts.module";

describe('Process NFTs Service', () => {
  let processNftService: ProcessNftsService;

  const nftIdentifier: string = 'EWIZZ-1e8ddb-021c';

  beforeAll(async () => {
    await Initializer.initialize();
    const moduleRef = await Test.createTestingModule({
      imports: [PublicAppModule, ProcessNftsModule],
    }).compile();

    processNftService = moduleRef.get<ProcessNftsService>(ProcessNftsService);

  }, Constants.oneHour() * 1000);

  describe.only('Process NFT', () => {
    it('should return true if nft is process ', async () => {
      const nftSettings = new ProcessNftSettings();
      nftSettings.forceRefreshMedia = true;
      const process = await processNftService.processNft(nftIdentifier, nftSettings);
      expect(process).toBeTruthy();
    });
  });

  //TBD- The process is taking to long: Exceeded timeout of 60000 ms for a test.
  /*describe('Process Collection', () => {
    it('should process NFT collection with identifier EGLDRIDEFL-74b819', async () => {
      const collection = new NftFilter();
      collection.collection = nftCollection;
      const nftSetting = new ProcessNftSettings();
      const process = await processNftService.processCollection(collection.collection, nftSetting);
      expect(process).toBeInstanceOf(Object);
    });
  });*/
});