import { Test } from "@nestjs/testing";
import { Nft } from "src/endpoints/nfts/entities/nft";
import { NftFilter } from "src/endpoints/nfts/entities/nft.filter";
import { NftService } from "src/endpoints/nfts/nft.service";
import { PublicAppModule } from "src/public.app.module";
import { NftThumbnailModule } from "src/queue.worker/nft.worker/queue/job-services/thumbnails/nft.thumbnail.module";
import { NftThumbnailService } from "src/queue.worker/nft.worker/queue/job-services/thumbnails/nft.thumbnail.service";

describe('Nft Queue Service', () => {
  let nftQueueService: NftThumbnailService;
  let nftService: NftService;

  const myPinataUrl: string = 'https://wwwine.mypinata.cloud/ipfs/QmXhZjHWSiEijsdf2RS1g5jRvDmkiAufNdqp5qVet6gbbe/998.jpg';
  const elrondMediaUrl: string = 'https://media.elrond.com/nfts/thumbnail/default.png';

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [NftThumbnailModule, PublicAppModule],
    }).compile();

    nftQueueService = moduleRef.get<NftThumbnailService>(NftThumbnailService);
    nftService = moduleRef.get<NftService>(NftService);

    const nfts = await nftService.getNfts({ from: 0, size: 1 }, new NftFilter());
    expect(nfts).toHaveLength(1);

  });

  describe('HasThumbnail Generated', () => {
    it('should return true if nft has thumbnail generated', async () => {
      const nftFilter = new Nft();
      nftFilter.identifier = 'WWWINE-5a5331-03e6';
      const thumbnailGenerated = await nftQueueService.hasThumbnailGenerated(nftFilter.identifier, myPinataUrl);
      expect(thumbnailGenerated).toStrictEqual(true);
    });

    it('should return false if nft does not contain thumbnail generated ', async () => {
      const nftFilter = new Nft();
      nftFilter.identifier = 'MEXFARM-e7af52-438c8a';
      const thumbnailGenerated = await nftQueueService.hasThumbnailGenerated(nftFilter.identifier, elrondMediaUrl);
      expect(thumbnailGenerated).toStrictEqual(false);
    });
  });
});
