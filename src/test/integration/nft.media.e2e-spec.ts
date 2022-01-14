import {NftService} from "../../endpoints/nfts/nft.service";
import Initializer from "./e2e-init";
import {Test} from "@nestjs/testing";
import {PublicAppModule} from "../../public.app.module";
import {NftFilter} from "../../endpoints/nfts/entities/nft.filter";
import {Constants} from "../../utils/constants";
import {NftMediaService} from "../../queue.worker/nft.worker/queue/job-services/media/nft.media.service";
import {Nft} from "../../endpoints/nfts/entities/nft";


describe('Nft Media Service', () => {
  let nftMediaService: NftMediaService;
  let nftService: NftService;
  let nftIdentifier: string;


  beforeAll(async () => {
    await Initializer.initialize();

    const moduleRef = await Test.createTestingModule({
      imports: [PublicAppModule],
    }).compile();

    nftMediaService = moduleRef.get<NftMediaService>(NftMediaService);
    nftService = moduleRef.get<NftService>(NftService);

    const nfts = await nftService.getNfts({from: 0, size: 1}, new NftFilter());
    expect(nfts).toHaveLength(1);

    const nft = nfts[0];
    nftIdentifier = nft.identifier;

  }, Constants.oneHour() * 1000);

  describe('Get Media', () => {
    it('should return a list of nfts', async () => {
      const nftFiler = new Nft();
      nftFiler.identifier = nftIdentifier;
      const nftGetMedia = await nftMediaService.getMedia(nftFiler);
      expect(nftGetMedia).toBeNull();
    });
  });

  describe("Refresh Media", () => {
    it('should refresh media for nft', async () => {
      const nftFiler = new Nft();
      nftFiler.identifier = nftIdentifier;
      const nftRefreshMedia = await nftMediaService.refreshMedia(nftFiler);
      expect(nftRefreshMedia).toBeInstanceOf(Array);
    });
  });
});