import Initializer from "./e2e-init";
import { Test } from "@nestjs/testing";
import { PublicAppModule } from "../../public.app.module";
import { QueueWorkerModule } from "../../queue.worker/queue.worker.module";
import { Constants } from "../../utils/constants";
import { NftMetadataService } from "../../queue.worker/nft.worker/queue/job-services/metadata/nft.metadata.service";
import { Nft } from "../../endpoints/nfts/entities/nft";
import { NftFilter } from "../../endpoints/nfts/entities/nft.filter";
import { NftService } from "../../endpoints/nfts/nft.service";
import { NftType } from "../../endpoints/nfts/entities/nft.type";

describe('Nft Metadata Service', () => {
  let nftMetadataService: NftMetadataService;
  let nftService: NftService;
  let nftIdentifier: string;

  beforeAll(async () => {
    await Initializer.initialize();

    const moduleRef = await Test.createTestingModule({
      imports: [PublicAppModule, QueueWorkerModule],
    }).compile();

    nftMetadataService = moduleRef.get<NftMetadataService>(NftMetadataService);
    nftService = moduleRef.get<NftService>(NftService);

    const nfts = await nftService.getNfts({ from: 0, size: 1 }, new NftFilter());
    expect(nfts).toHaveLength(1);

    const nft = nfts[0];
    nftIdentifier = nft.identifier;

  }, Constants.oneHour() * 1000);

  describe('Get Or Refresh Metadata', () => {
    it(`it should return NFT properties based on nft value `, async () => {
      const nftValue = new Nft();
      nftValue.name = 'EGLDRIDEFL-74b819-042191';
      nftValue.attributes = 'AAAACA+tqHq/YcRVAAAAAAAAAhQAAAAAAAACFAAAAAdEsMbf5CtvAAAAAAAAAAdEsMbf5Ctv';
      const nftReturn = await nftMetadataService.getOrRefreshMetadata(nftValue);
      expect(nftReturn).toBeInstanceOf(Object);
    });
    it(`it should return undefined `, async () => {
      const nftValue = new Nft();
      nftValue.name = 'EGLDRIDEFL-74b819-042191';
      const nftReturn = await nftMetadataService.getOrRefreshMetadata(nftValue);
      expect(nftReturn).toBeUndefined();
    });
  });

  describe('Get Metadata', () => {
    it(`should return metadata of nft`, async () => {
      const nftValue = new Nft();
      nftValue.name = nftIdentifier;
      const nftReturn = await nftMetadataService.getMetadata(nftValue);
      expect(nftReturn).toBeInstanceOf(Object);
    });
  });

  describe('Refresh Metadata', () => {
    it(`should refresh metadata of nft`, async () => {
      const nftValue = new Nft();
      nftValue.name = nftIdentifier;
      const nftReturn = await nftMetadataService.refreshMetadata(nftValue);
      expect(nftReturn).toBeInstanceOf(Object);
    });
  });

  describe('Get Metadata Raw', () => {
    it(`should return null if nft.type is MetaESDT`, async () => {
      const nftValue = new Nft();
      nftValue.type = NftType.MetaESDT;
      const nftReturn = await nftMetadataService.getMetadataRaw(nftValue);

      expect(nftReturn).toBeNull();
    });
  });
});