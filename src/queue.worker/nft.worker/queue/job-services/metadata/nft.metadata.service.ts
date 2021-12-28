import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { CachingService } from "src/common/caching/caching.service";
import { CacheInfo } from "src/common/caching/entities/cache.info";
import { Nft } from "src/endpoints/nfts/entities/nft";
import { NftMetadata } from "src/endpoints/nfts/entities/nft.metadata";
import { NftExtendedAttributesService } from "src/endpoints/nfts/nft.extendedattributes.service";
import { Constants } from "src/utils/constants";
import { Repository } from "typeorm";
import { NftMetadataDb } from "./entities/nft.metadata.db";


@Injectable()
export class NftMetadataService {
  private readonly logger: Logger;

  constructor(
    private readonly nftExtendedAttributesService: NftExtendedAttributesService,
    private readonly cachingService: CachingService,
    @InjectRepository(NftMetadataDb)
    private readonly nftMetadataRepository: Repository<NftMetadataDb>,
  ) {
    this.logger = new Logger(NftMetadataService.name);
  }

  async getMetadata(nft: Nft): Promise<NftMetadata | undefined> {
    let metadataDb: NftMetadataDb | undefined = await this.nftMetadataRepository.findOne(nft.identifier);

    if (!metadataDb) {
      return undefined;
    }

    let metadata: NftMetadata = metadataDb.json ? JSON.parse(metadataDb.json) : undefined;

    return metadata;
  }

  async setMetadata(nft: Nft): Promise<void> {
    const metadataDb: NftMetadataDb = new NftMetadataDb();
    metadataDb.id = nft.identifier;

    const metadataRaw = await this.getMetadataRaw(nft);
    if (metadataRaw) {
      metadataDb.json = JSON.stringify(metadataRaw);
      await this.nftMetadataRepository.save(metadataDb);
    }
  }

  async getMetadataRaw(nft: Nft): Promise<NftMetadata | null> {
    if (!nft.attributes) {
      return null;
    }

    try {
      this.logger.log(`Started fetching metadata for nft with identifier '${nft.identifier}'`);
      let nftMetadata = await this.nftExtendedAttributesService.tryGetExtendedAttributesFromBase64EncodedAttributes(nft.attributes);
      this.logger.log(`Completed fetching metadata for nft with identifier '${nft.identifier}'`);
      return nftMetadata ?? null;
    } catch (error) {
      this.logger.error(error);
      this.logger.error(`Error when fetching metadata for nft with identifier '${nft.identifier}'`);
      throw error;
    }
  }
}