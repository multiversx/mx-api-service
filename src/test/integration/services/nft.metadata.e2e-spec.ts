import { Test } from "@nestjs/testing";
import '@multiversx/sdk-nestjs/lib/src/utils/extensions/array.extensions';
import { PublicAppModule } from "src/public.app.module";
import { NftMetadataService } from "src/queue.worker/nft.worker/queue/job-services/metadata/nft.metadata.service";
import { NftService } from "src/endpoints/nfts/nft.service";
import { NftFilter } from "src/endpoints/nfts/entities/nft.filter";
import { Nft } from "src/endpoints/nfts/entities/nft";
import { NftType } from "src/endpoints/nfts/entities/nft.type";

describe('Nft Metadata Service', () => {
  let nftMetadataService: NftMetadataService;
  let nftService: NftService;
  let nftIdentifier: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [PublicAppModule],
    }).compile();

    nftMetadataService = moduleRef.get<NftMetadataService>(NftMetadataService);
    nftService = moduleRef.get<NftService>(NftService);

    const nfts = await nftService.getNfts({ from: 0, size: 1 }, new NftFilter());
    expect(nfts).toHaveLength(1);

    const nft = nfts[0];
    nftIdentifier = nft.identifier;

  });

  describe('Get Or Refresh Metadata', () => {
    it(`it should return NFT properties based on nft value `, async () => {
      const properties = new Nft();
      properties.name = 'EGLDRIDEFL-74b819-042191';
      properties.attributes = 'AAAACA+tqHq/YcRVAAAAAAAAAhQAAAAAAAACFAAAAAdEsMbf5CtvAAAAAAAAAAdEsMbf5Ctv';
      const nftReturn = await nftMetadataService.getOrRefreshMetadata(properties);
      expect(nftReturn).toBeInstanceOf(Object);
    });

    it(`it should return undefined `, async () => {
      const properties = new Nft();
      properties.name = 'EGLDRIDEFL-74b819-042191';
      const nftReturn = await nftMetadataService.getOrRefreshMetadata(properties);
      expect(nftReturn).toBeUndefined();
    });
  });

  describe('Get Metadata', () => {
    it(`should return metadata of nft`, async () => {
      const property = new Nft();
      property.name = nftIdentifier;
      const nftReturn = await nftMetadataService.getMetadata(property);
      expect(nftReturn).toBeInstanceOf(Object);
    });
  });

  describe('Refresh Metadata', () => {
    it(`should refresh metadata of nft`, async () => {
      const property = new Nft();
      property.name = nftIdentifier;
      const nftReturn = await nftMetadataService.refreshMetadata(property);
      expect(nftReturn).toBeInstanceOf(Object);
    });
  });

  describe('Get Metadata Raw', () => {
    it(`should return null if nft.type is MetaESDT`, async () => {
      const property = new Nft();
      property.type = NftType.MetaESDT;
      const nftReturn = await nftMetadataService.getMetadataRaw(property);
      expect(nftReturn).toBeNull();
    });
  });
});
