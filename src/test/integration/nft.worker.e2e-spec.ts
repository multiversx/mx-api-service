import { Test } from "@nestjs/testing";
import { NftWorkerService } from "../../queue.worker/nft.worker/nft.worker.service";
import { Nft } from "../../endpoints/nfts/entities/nft";
import { ProcessNftSettings } from "../../endpoints/process-nfts/entities/process.nft.settings";
import { NftWorkerModule } from "src/queue.worker/nft.worker/nft.worker.module";
import { NftType } from "../../endpoints/nfts/entities/nft.type";
import { NftThumbnailService } from "src/queue.worker/nft.worker/queue/job-services/thumbnails/nft.thumbnail.service";

describe('Nft Worker Service', () => {
  let nftWorkerService: NftWorkerService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [NftWorkerModule],
    }).compile();

    nftWorkerService = moduleRef.get<NftWorkerService>(NftWorkerService);
  });

  beforeEach(() => { jest.restoreAllMocks(); });


  describe('addProcessNftQueueJob', () => {
    it('should return true if nft is processed', async () => {
      const nft: Nft = new Nft();
      nft.identifier = 'MAW-894a92-0270';

      const settings = new ProcessNftSettings();
      settings.forceRefreshMedia = true;

      const result = await nftWorkerService.addProcessNftQueueJob(nft, settings);

      expect(result).toStrictEqual(true);
    });

    it('should return false if nft does not need to be processed', async () => {
      jest.spyOn(NftWorkerService.prototype, 'needsProcessing')
        // eslint-disable-next-line require-await
        .mockImplementation(jest.fn(async (_nft: Nft, _settings: ProcessNftSettings) => false));

      const nft: Nft = new Nft();
      nft.identifier = 'MAW-894a92-0270';

      const settings: ProcessNftSettings = new ProcessNftSettings();
      settings.forceRefreshMedia = true;

      const result = await nftWorkerService.addProcessNftQueueJob(nft, settings);

      expect(result).toStrictEqual(false);
    });
  });

  describe('needsProcessing', () => {
    it('should return false if esdt is the type MetaESDT', async () => {
      const nft: Nft = new Nft();
      nft.type = NftType.MetaESDT;

      const settings: ProcessNftSettings = new ProcessNftSettings();
      settings.forceRefreshMedia = true;

      const result = await nftWorkerService.needsProcessing(nft, settings);

      expect(result).toStrictEqual(false);
    });

    it('should return true if one of the "forceRefresh" settings is active', async () => {
      const nft: Nft = new Nft();
      nft.identifier = 'MAW-894a92-0270';

      const settings: ProcessNftSettings = new ProcessNftSettings();
      settings.forceRefreshMedia = true;

      const result = await nftWorkerService.needsProcessing(nft, settings);

      expect(result).toStrictEqual(true);
    });

    it('should return true if skipRefreshThumbnail settings is active', async () => {
      const nft: Nft = new Nft();
      nft.identifier = 'MAW-894a92-0270';

      const settings: ProcessNftSettings = new ProcessNftSettings();
      settings.skipRefreshThumbnail = true;

      const result = await nftWorkerService.needsProcessing(nft, settings);

      expect(result).toStrictEqual(true);
    });

    it('should return true if media is undefined', async () => {
      const nft = new Nft();
      nft.media = undefined;

      const nftOptions = new ProcessNftSettings();
      nftOptions.forceRefreshMedia = true;

      const result = await nftWorkerService.needsProcessing(nft, nftOptions);
      expect(result).toStrictEqual(true);
    });

    it('should return true if metadata is undefined', async () => {
      const nft = new Nft();
      nft.metadata = undefined;

      const result = await nftWorkerService.needsProcessing(nft, new ProcessNftSettings());
      expect(result).toStrictEqual(true);
    });

    it('should return true if media is defined and has thumbnail is generated', async () => {
      jest.spyOn(NftThumbnailService.prototype, 'hasThumbnailGenerated')
        // eslint-disable-next-line require-await
        .mockImplementation(jest.fn(async (_identifier: string, _fileUrl: string) => false));

      const nft = new Nft();
      nft.identifier = 'MAW-894a92-0270';

      const nftOptions = new ProcessNftSettings();
      nftOptions.skipRefreshThumbnail = false;

      const result = await nftWorkerService.needsProcessing(nft, nftOptions);
      expect(result).toStrictEqual(true);
    });
  });
});
