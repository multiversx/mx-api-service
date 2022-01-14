import {ProcessNftsService} from "../../endpoints/process-nfts/process.nfts.service";
import Initializer from "./e2e-init";
import {Test} from "@nestjs/testing";
import {PublicAppModule} from "../../public.app.module";
import {Constants} from "../../utils/constants";
import {ProcessNftSettings} from "../../endpoints/process-nfts/entities/process.nft.settings";
import {ProcessNftsModule} from "../../endpoints/process-nfts/process.nfts.module";

describe('Process NFTs Service', () => {
  let processNftService: ProcessNftsService;

  beforeAll(async () => {
    await Initializer.initialize();
    const moduleRef = await Test.createTestingModule({
      imports: [PublicAppModule, ProcessNftsModule],
    }).compile();

    processNftService = moduleRef.get<ProcessNftsService>(ProcessNftsService);

  }, Constants.oneHour() * 1000);

  describe('Process NFT', () => {
    it('should process NFT and return true ', async () => {
      const nftSetting = new ProcessNftSettings();
      const process = await processNftService.processNft('EGLDRIDEFL-74b819-042191', nftSetting);
      expect(process).toBeTruthy();
    });
    it('should process NFT and return false', async () => {
      const nftSetting = new ProcessNftSettings();
      const process = await processNftService.processNft('WWWINE-5a5331-03e6', nftSetting);
      expect(process).toBeFalsy();
    });
  });

  describe('Process Collection', () => {
    it('should process NFT collection with identifier EGLDRIDEFL-74b819', async () => {
      const nftSetting = new ProcessNftSettings();
      const process = await processNftService.processCollection('EGLDRIDEFL-74b819', nftSetting);
      expect(process).toBeInstanceOf(Object);
    });
  });
});