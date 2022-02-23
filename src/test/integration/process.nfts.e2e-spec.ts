import { NftService } from '../../endpoints/nfts/nft.service';
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

    it("should throw new error if nft identifier is not correct", async () => {
      const filter = new ProcessNftSettings();
      filter.skipRefreshThumbnail = true;

      jest
        .spyOn(NftService.prototype, 'getSingleNft')
        // eslint-disable-next-line require-await
        .mockImplementation(jest.fn(async () => undefined));

      const process = await processNftService.processNft("invalidIdentifier", filter);

      expect(process).toBeFalsy();
    });
  });

  describe("processCollection", () => {
    it("should process collection", async () => {
      const filter = new ProcessNftSettings();
      filter.skipRefreshThumbnail = true;

      const collection: string = "CPA-c6d2fb";
      const process = await processNftService.processCollection(collection, filter);

      expect(process).toBeTruthy();
    });
  });
});
