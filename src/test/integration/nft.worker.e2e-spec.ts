import { Test } from "@nestjs/testing";
import { NftWorkerService } from "../../queue.worker/nft.worker/nft.worker.service";
import { Nft } from "../../endpoints/nfts/entities/nft";
import nftExample from "../data/esdt/nft/nft.example";
import { ProcessNftSettings } from "../../endpoints/process-nfts/entities/process.nft.settings";
import { NftWorkerModule } from "src/queue.worker/nft.worker/nft.worker.module";
import { NftType } from "../../endpoints/nfts/entities/nft.type";

describe('Nft Worker Service', () => {
  let nftWorkerService: NftWorkerService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [NftWorkerModule],
    }).compile();

    nftWorkerService = moduleRef.get<NftWorkerService>(NftWorkerService);
  });

  describe('Add Process Nft Queue Job', () => {
    it('should force refresh media for nft', async () => {
      const nft = new Nft();
      nft.identifier = nftExample.identifier;

      const nftOptions = new ProcessNftSettings();
      nftOptions.forceRefreshMedia = true;

      const result = await nftWorkerService.addProcessNftQueueJob(nft, nftOptions);
      expect(result).toStrictEqual(true);
    });

    it("should return null if nft type is MetaESDT", async () => {
      const nft = new Nft();
      nft.type = NftType.MetaESDT;

      const nftOptions = new ProcessNftSettings();
      nftOptions.forceRefreshMedia = true;

      const result = await nftWorkerService.addProcessNftQueueJob(nft, nftOptions);
      expect(result).toBeFalsy();
    });
  });

  describe('Needs Processing', () => {
    it('should return true on nft processing', async () => {
      const nft = new Nft();
      nft.identifier = nftExample.identifier;

      const nftOptions = new ProcessNftSettings();
      nftOptions.forceRefreshMedia = true;

      const result = await nftWorkerService.needsProcessing(nft, nftOptions);
      expect(result).toStrictEqual(true);
    });

    it('should return true if ProcessNftSettings are set to true', async () => {
      const nft = new Nft();
      nft.identifier = nftExample.identifier;

      const nftOptions = new ProcessNftSettings();
      nftOptions.forceRefreshMedia = true;

      const result = await nftWorkerService.needsProcessing(nft, nftOptions);
      expect(result).toStrictEqual(true);
    });

    it('should return true if nft.media.length == 0', async () => {
      const nft = new Nft();
      nft.identifier = 'LKMEX-aab910-23049b';

      const nftOptions = new ProcessNftSettings();
      nftOptions.forceRefreshMedia = true;

      const result = await nftWorkerService.needsProcessing(nft, nftOptions);
      expect(result).toStrictEqual(true);
    });
  });
});
