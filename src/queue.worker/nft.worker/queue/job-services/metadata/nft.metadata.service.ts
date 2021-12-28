import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Nft } from "src/endpoints/nfts/entities/nft";
import { NftMetadata } from "src/endpoints/nfts/entities/nft.metadata";
import { NftExtendedAttributesService } from "src/endpoints/nfts/nft.extendedattributes.service";
import { ApiUtils } from "src/utils/api.utils";
import { Repository } from "typeorm";
import { NftMetadataDb } from "./entities/nft.metadata.db";


@Injectable()
export class NftMetadataService {
  private readonly logger: Logger;

  constructor(
    private readonly nftExtendedAttributesService: NftExtendedAttributesService,
    @InjectRepository(NftMetadataDb)
    private readonly nftMetadataRepository: Repository<NftMetadataDb>,
  ) {
    this.logger = new Logger(NftMetadataService.name);
  }

  async getMetadata(nft: Nft): Promise<NftMetadata | undefined> {
    let metadataDb: NftMetadataDb | undefined = await this.nftMetadataRepository.findOne({ id: nft.identifier });

    if (!metadataDb) {
      return undefined;
    }

    return ApiUtils.mergeObjects(new NftMetadataDb(), metadataDb);
  }

  async setMetadata(nft: Nft): Promise<void> {
    const metadataRaw = await this.getMetadataRaw(nft);
    if (metadataRaw) {
      let metadataDb: NftMetadataDb = new NftMetadataDb();
      metadataDb = ApiUtils.mergeObjects(new NftMetadataDb(), metadataRaw)
      metadataDb.id = nft.identifier;

      const found = await this.nftMetadataRepository.findOne({ id: nft.identifier });

      if (!found) {
        await this.nftMetadataRepository.save(metadataDb);
      } else {
        await this.nftMetadataRepository.update({ id: nft.identifier }, metadataDb)
      }
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