import { ProcessNftsModule } from '../../endpoints/process-nfts/process.nfts.module';
import { ProcessNftSettings } from '../../endpoints/process-nfts/entities/process.nft.settings';
import { ProcessNftsService } from '../../endpoints/process-nfts/process.nfts.service';
import { Test } from '@nestjs/testing';
import { Constants } from 'src/utils/constants';
import Initializer from './e2e-init';
import nftExample from '../data/esdt/nft/nft.example';

describe('Process Nft Service', () => {
  let processNftService: ProcessNftsService;

  beforeAll(async () => {
    await Initializer.initialize();

    const moduleRef = await Test.createTestingModule({
      imports: [ProcessNftsModule],
    }).compile();

    processNftService = moduleRef.get<ProcessNftsService>(ProcessNftsService);

  }, Constants.oneHour() * 1000);

  describe("processNft", () => {
    it("should refresh media", async () => {
      const filter = new ProcessNftSettings();
      filter.forceRefreshMedia = true;
      const process = await processNftService.processNft(nftExample.identifier, filter);

      expect(process).toBeTruthy();
    });

    it("should refresh metadata", async () => {
      const filter = new ProcessNftSettings();
      filter.forceRefreshMetadata = true;
      const process = await processNftService.processNft(nftExample.identifier, filter);

      expect(process).toBeTruthy();
    });

    it("should refresh metadata", async () => {
      const filter = new ProcessNftSettings();
      filter.forceRefreshThumbnail = true;
      const process = await processNftService.processNft(nftExample.identifier, filter);

      expect(process).toBeTruthy();
    });

    it("should refresh metadata", async () => {
      const filter = new ProcessNftSettings();
      filter.skipRefreshThumbnail = true;
      const process = await processNftService.processNft(nftExample.identifier, filter);

      expect(process).toBeTruthy();
    });
  });
});
