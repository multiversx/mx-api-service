import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { CachingService } from "src/common/caching/caching.service";
import { CacheInfo } from "src/common/caching/entities/cache.info";
import { Nft } from "src/endpoints/nfts/entities/nft";
import { NftExtendedAttributesService } from "src/endpoints/nfts/nft.extendedattributes.service";
import { Repository } from "typeorm";
import { NftMetadataDb } from "./entities/nft.metadata.db";


@Injectable()
export class NftMetadataService {
  private readonly logger: Logger;

  constructor(
    private readonly nftExtendedAttributesService: NftExtendedAttributesService,
    @InjectRepository(NftMetadataDb)
    private readonly nftMetadataRepository: Repository<NftMetadataDb>,
    private readonly cachingService: CachingService,
  ) {
    this.logger = new Logger(NftMetadataService.name);
  }

  async getMetadataFromDb(nft: Nft): Promise<any> {
    let metadataDb: NftMetadataDb | undefined = await this.nftMetadataRepository.findOne({ id: nft.identifier });
    if (!metadataDb) {
      return null;
    }

    return metadataDb.content;
  }

  async getMetadata(nft: Nft): Promise<any> {
    return this.cachingService.getOrSetCache(
      CacheInfo.NftMetadata(nft.identifier).key,
      async () => await this.getMetadataFromDb(nft),
      CacheInfo.NftMetadata(nft.identifier).ttl
    );
  }

  async refreshMetadata(nft: Nft): Promise<void> {
    const metadataRaw = await this.getMetadataRaw(nft);
    if (!metadataRaw) {
      return;
    }

    let metadataDb: NftMetadataDb = new NftMetadataDb();
    metadataDb.id = nft.identifier;
    metadataDb.content = metadataRaw;

    const found = await this.nftMetadataRepository.findOne({ id: nft.identifier });
    if (!found) {
      await this.nftMetadataRepository.save(metadataDb);
    } else {
      await this.nftMetadataRepository.update({ id: nft.identifier }, metadataDb)
    }

    await this.cachingService.setCache(
      CacheInfo.NftMetadata(nft.identifier).key,
      metadataRaw,
      CacheInfo.NftMetadata(nft.identifier).ttl
    )
  }

  async getMetadataRaw(nft: Nft): Promise<any> {
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