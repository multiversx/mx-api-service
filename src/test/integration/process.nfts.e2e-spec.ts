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

  describe('Process NFT', () => {
    it('should return true if nft is process ', async () => {
      const nftSettings = new ProcessNftSettings();
      nftSettings.forceRefreshMedia = true;
      const process = await processNftService.processNft(nftIdentifier, nftSettings);
      expect(process).toBeTruthy();
    });
  });
});
