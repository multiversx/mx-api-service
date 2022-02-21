import { Test } from "@nestjs/testing";
import { NftWorkerService } from "../../queue.worker/nft.worker/nft.worker.service";
import { Nft } from "../../endpoints/nfts/entities/nft";
import nftExample from "../data/esdt/nft/nft.example";
import { ProcessNftSettings } from "../../endpoints/process-nfts/entities/process.nft.settings";
import { NftWorkerModule } from "src/queue.worker/nft.worker/nft.worker.module";
import { PublicAppModule } from "src/public.app.module";

describe('Nft Worker Service', () => {
  let nftWorkerService: NftWorkerService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [NftWorkerModule, PublicAppModule],
    }).compile();

    nftWorkerService = moduleRef.get<NftWorkerService>(NftWorkerService);
  });

  describe('Add Process Nft Queue Job', () => {
    it('should return nft process "true" with forceRefreshMedia = true', async () => {
      const nft = new Nft();
      nft.identifier = nftExample.identifier;

      const nftSettings = new ProcessNftSettings();
      nftSettings.forceRefreshMedia = true;

      const process = await nftWorkerService.addProcessNftQueueJob(nft, nftSettings);
      expect(process).toStrictEqual(true);
    });
  });

  describe('Needs Processing', () => {
    it('should return true on nft processing', async () => {
      const nft = new Nft();
      nft.identifier = nftExample.identifier;

      const nftSettings = new ProcessNftSettings();
      nftSettings.forceRefreshMedia = true;

      const process = await nftWorkerService.needsProcessing(nft, nftSettings);
      expect(process).toStrictEqual(true);
    });

    it('should return true if ProcessNftSettings are set to true', async () => {
      const nft = new Nft();
      nft.identifier = nftExample.identifier;

      const nftSettings = new ProcessNftSettings();
      nftSettings.forceRefreshMedia = true;

      const process = await nftWorkerService.needsProcessing(nft, nftSettings);
      expect(process).toStrictEqual(true);
    });

    it('should return true if nft.media.length == 0', async () => {
      const nft = new Nft();
      nft.identifier = 'LKMEX-aab910-23049b';

      const nftSettings = new ProcessNftSettings();
      nftSettings.forceRefreshMedia = true;

      const process = await nftWorkerService.needsProcessing(nft, nftSettings);
      expect(process).toStrictEqual(true);
    });
  });
});
