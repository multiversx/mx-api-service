import { NftService } from "../../endpoints/nfts/nft.service";
import { Test } from "@nestjs/testing";
import { NftFilter } from "../../endpoints/nfts/entities/nft.filter";
import { NftMediaService } from "../../queue.worker/nft.worker/queue/job-services/media/nft.media.service";
import { Nft } from "../../endpoints/nfts/entities/nft";
import { NftMedia } from "../../endpoints/nfts/entities/nft.media";
import { NftMediaModule } from "src/queue.worker/nft.worker/queue/job-services/media/nft.media.module";
import '@elrondnetwork/erdnest/lib/src/utils/extensions/array.extensions';
import { PublicAppModule } from "src/public.app.module";

describe('Nft Media Service', () => {
  let nftMediaService: NftMediaService;
  let nftService: NftService;
  let nftIdentifier: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [NftMediaModule, PublicAppModule],
    }).compile();

    nftMediaService = moduleRef.get<NftMediaService>(NftMediaService);
    nftService = moduleRef.get<NftService>(NftService);

    const nfts = await nftService.getNfts({ from: 0, size: 1 }, new NftFilter());
    expect(nfts).toHaveLength(1);

    const nft = nfts[0];
    nftIdentifier = nft.identifier;
  });

  describe("Refresh Media", () => {
    it('should return nft media', async () => {
      const nftFilter = new Nft();
      nftFilter.identifier = nftIdentifier;
      const refreshMedia = await nftMediaService.refreshMedia(nftFilter);

      if (!refreshMedia) {
        throw new Error('Media must be defined');
      }

      for (const media of refreshMedia) {
        expect(media.url).toBeDefined();
        expect(media).toHaveStructure(Object.keys(new NftMedia()));
      }
    });
  });
});
