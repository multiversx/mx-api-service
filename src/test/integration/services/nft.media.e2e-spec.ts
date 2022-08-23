import '@elrondnetwork/erdnest/lib/src/utils/extensions/array.extensions';
import { Test } from '@nestjs/testing';
import { MediaMimeTypeEnum } from 'src/endpoints/nfts/entities/media.mime.type';
import { Nft } from 'src/endpoints/nfts/entities/nft';
import { NftFilter } from 'src/endpoints/nfts/entities/nft.filter';
import { NftMedia } from 'src/endpoints/nfts/entities/nft.media';
import { NftType } from 'src/endpoints/nfts/entities/nft.type';
import { NftService } from 'src/endpoints/nfts/nft.service';
import { PublicAppModule } from "src/public.app.module";
import { NftMediaModule } from 'src/queue.worker/nft.worker/queue/job-services/media/nft.media.module';
import { NftMediaService } from 'src/queue.worker/nft.worker/queue/job-services/media/nft.media.service';

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

  beforeEach(() => {
    jest.restoreAllMocks();
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

    it('should not accept content (media file is too large)', async () => {
      jest
        .spyOn(NftMediaService.prototype as any, "getFileProperties")
        // eslint-disable-next-line require-await
        .mockImplementation(jest.fn(async () => ({ contentType: MediaMimeTypeEnum.mp4, contentLength: 70000001 })));

      const nft = new Nft({ type: NftType.NonFungibleESDT, uris: ['some_uris'], identifier: 'LSC-a2b6b5-04' });

      const mediaRaw = await nftMediaService.refreshMedia(nft);

      expect(mediaRaw?.length).toStrictEqual(0);
    });

    it('should not accept content (media mime type is not accepted)', async () => {
      jest
        .spyOn(NftMediaService.prototype as any, "getFileProperties")
        // eslint-disable-next-line require-await
        .mockImplementation(jest.fn(async () => ({ contentType: "NOT_ACCEPTED", contentLength: 1234 })));

      const nft = new Nft({ type: NftType.NonFungibleESDT, uris: ['some_uris'], identifier: 'LSC-a2b6b5-02' });

      const mediaRaw = await nftMediaService.refreshMedia(nft);

      expect(mediaRaw?.length).toStrictEqual(0);
    });

    it('should not accept content (file properties not returned)', async () => {
      jest
        .spyOn(NftMediaService.prototype as any, "getFileProperties")
        // eslint-disable-next-line require-await
        .mockImplementation(jest.fn(async () => null));

      const nft = new Nft({ type: NftType.NonFungibleESDT, uris: ['some_uris'], identifier: 'LSC-a2b6b5-03' });

      const mediaRaw = await nftMediaService.refreshMedia(nft);

      expect(mediaRaw?.length).toStrictEqual(0);
    });

    it('should accept content and return valid media', async () => {
      jest
        .spyOn(NftMediaService.prototype as any, "getFileProperties")
        // eslint-disable-next-line require-await
        .mockImplementation(jest.fn(async () => ({ contentType: "image/png", contentLength: 4761020 })));

      const nft = new Nft({ type: NftType.NonFungibleESDT, uris: ['aHR0cHM6Ly9pcGZzLmlvL2lwZnMvYmFmeWJlaWVrcHV0a3A3eGR2aXpwaWZ2Yzdkcmp5Mml5M2l4NHU3c3psazdobnR6bTdhZ3UyYjZ2NXEvMzg5Ni5wbmc='], identifier: 'K402-22c4bb-c0', collection: 'K402-22c4bb' });

      const mediaRaw = await nftMediaService.refreshMedia(nft);

      expect(mediaRaw?.length).toStrictEqual(1);

      if (!mediaRaw) {
        throw new Error("Media should be returned");
      }

      expect(mediaRaw[0].fileSize).toStrictEqual(4761020);
      expect(mediaRaw[0].fileType).toStrictEqual(MediaMimeTypeEnum.png);
      expect(mediaRaw[0].url).toStrictEqual('https://media.elrond.com/nfts/asset/bafybeiekputkp7xdvizpifvc7drjy2iy3ix4u7szlk7hntzm7agu2b6v5q/3896.png');
      expect(mediaRaw[0].thumbnailUrl).toStrictEqual('https://media.elrond.com/nfts/thumbnail/K402-22c4bb-d5990d89');
    });
  });
});
