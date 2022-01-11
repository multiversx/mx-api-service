import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { NftMedia } from "src/endpoints/nfts/entities/nft.media";
import { NftMediaDb } from "src/common/persistence/database/entities/nft.media.db";
import { NftMetadataDb } from "src/common/persistence/database/entities/nft.metadata.db";
import { Repository } from "typeorm";
import { PersistenceInterface } from "../persistence.interface";
import { ApiUtils } from "src/utils/api.utils";

@Injectable()
export class DatabaseService implements PersistenceInterface {
  private readonly logger: Logger;

  constructor(
    @InjectRepository(NftMetadataDb)
    private readonly nftMetadataRepository: Repository<NftMetadataDb>,
    @InjectRepository(NftMediaDb)
    private readonly nftMediaRepository: Repository<NftMediaDb>,
  ) {
    this.logger = new Logger(DatabaseService.name);
  }

  async getMetadata(identifier: string): Promise<any | null> {
    try {
      const metadataDb: NftMetadataDb | undefined = await this.nftMetadataRepository.findOne({ id: identifier });
      if (!metadataDb) {
        return null;
      }

      return metadataDb.content;
    } catch (error) {
      this.logger.error(`An unexpected error occurred when fetching metadata from DB for identifier '${identifier}'`);
      this.logger.error(error);
      return {};
    }
  }

  async batchGetMetadata(identifiers: string[]): Promise<{ [key: string]: any[] }> {
    const chunks = ApiUtils.getChunks(identifiers, 100);

    const metadatas: { [key: string]: any[] } = {};
    for (const chunk of chunks) {
      const metadatasDb = await this.nftMetadataRepository.findByIds(chunk);

      for (const metadataDb of metadatasDb) {
        if (metadataDb.id) {
          metadatas[metadataDb.id] = metadataDb.content;
        }
      }
    }

    return metadatas;
  }

  async setMetadata(identifier: string, content: any): Promise<void> {
    const metadata = new NftMetadataDb();
    metadata.id = identifier;
    metadata.content = content;

    await this.nftMetadataRepository.save(metadata);
  }

  async getMedia(identifier: string): Promise<NftMedia[] | null> {
    try {
      const media: NftMediaDb | undefined = await this.nftMediaRepository.findOne({ id: identifier });
      if (!media) {
        return null;
      }

      return media.content;
    } catch (error) {
      this.logger.error(`An unexpected error occurred when fetching media from DB for identifier '${identifier}'`);
      this.logger.error(error);
      return [];
    }
  }

  async batchGetMedia(identifiers: string[]): Promise<{ [key: string]: NftMedia[] }> {
    const chunks = ApiUtils.getChunks(identifiers, 100);

    const medias: { [key: string]: NftMedia[] } = {};
    for (const chunk of chunks) {
      const mediasDb = await this.nftMediaRepository.findByIds(chunk);

      for (const mediaDb of mediasDb) {
        if (mediaDb.id) {
          medias[mediaDb.id] = mediaDb.content;
        }
      }
    }

    return medias;
  }

  async setMedia(identifier: string, media: NftMedia[]): Promise<void> {
    const value = new NftMediaDb();
    value.id = identifier;
    value.content = media;

    await this.nftMediaRepository.save(value);
  }
}