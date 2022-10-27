import { OriginLogger } from "@elrondnetwork/erdnest";
import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { CollectionTrait } from "src/endpoints/collections/entities/collection.trait";
import { NftMedia } from "src/endpoints/nfts/entities/nft.media";
import { ObjectLiteral, Repository } from "typeorm";
import { PersistenceInterface } from "../persistence.interface";
import { NftMediaDb } from "./entities/nft.media.db";
import { NftMetadataDb } from "./entities/nft.metadata.db";
import { NftTraitSummaryDb } from "./entities/nft.trait.summary.db";
import { SettingDb } from "./entities/setting.db";

@Injectable()
export class MongoDbService implements PersistenceInterface {
  private readonly logger = new OriginLogger(MongoDbService.name);

  constructor(
    @InjectRepository(NftMetadataDb)
    private readonly nftMetadataRepository: Repository<NftMetadataDb>,
    @InjectRepository(NftMediaDb)
    private readonly nftMediaRepository: Repository<NftMediaDb>,
    @InjectRepository(NftTraitSummaryDb)
    private readonly nftTraitSummaryRepository: Repository<NftTraitSummaryDb>,
    @InjectRepository(SettingDb)
    private readonly settingsRepository: Repository<SettingDb>,
  ) { }

  async getMetadata(identifier: string): Promise<any | null> {
    try {
      const metadataDb: NftMetadataDb | null = await this.nftMetadataRepository.findOne({ where: { id: identifier } });
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

  async batchGetMetadata(identifiers: string[]): Promise<Record<string, any>> {
    try {
      const metadatasDb = await this.nftMetadataRepository.find({
        where: {
          id: {
            // @ts-ignore
            $in: identifiers,
          },
        },
      });

      return metadatasDb.toRecord(metadata => metadata.id, metadata => metadata.content);
    } catch (error) {
      this.logger.log(`Error when getting metadata from DB for batch '${identifiers}'`);
      this.logger.error(error);

      return {};
    }
  }

  async setMetadata(identifier: string, content: any): Promise<void> {
    let metadata = await this.nftMetadataRepository.findOne({ where: { id: identifier } });
    if (!metadata) {
      metadata = new NftMetadataDb();
    }

    metadata.id = identifier;
    metadata.content = content;

    await this.save(this.nftMetadataRepository, metadata);
  }

  private async save<T extends ObjectLiteral>(repository: Repository<T>, entity: T) {
    try {
      // @ts-ignore
      await repository.save(entity);
    } catch (error) {
      // @ts-ignore
      if (error.code !== 11000) {
        throw error;
      }
    }
  }

  async deleteMetadata(identifier: string): Promise<void> {
    try {
      await this.nftMetadataRepository.delete({ id: identifier });
    } catch (error) {
      this.logger.error(`An unexpected error occurred when trying to delete metadata from DB for identifier '${identifier}'`);
      this.logger.error(error);
    }
  }

  async getMedia(identifier: string): Promise<NftMedia[] | null> {
    try {
      const media: NftMediaDb | null = await this.nftMediaRepository.findOne({ where: { id: identifier } });
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

  async batchGetMedia(identifiers: string[]): Promise<Record<string, NftMedia[]>> {
    try {
      const mediasDb = await this.nftMediaRepository.find({
        where: {
          id: {
            // @ts-ignore
            $in: identifiers,
          },
        },
      });

      return mediasDb.toRecord(media => media.id ?? '', media => media.content);
    } catch (error) {
      this.logger.log(`Error when getting media from DB for batch '${identifiers}'`);
      this.logger.error(error);

      return {};
    }
  }

  async setMedia(identifier: string, media: NftMedia[]): Promise<void> {
    let value = await this.nftMediaRepository.findOne({ where: { id: identifier } });
    if (!value) {
      value = new NftMediaDb();
    }

    value.id = identifier;
    value.content = media;

    await this.save(this.nftMediaRepository, value);
  }

  async getCollectionTraits(collection: string): Promise<CollectionTrait[] | null> {
    try {
      const summary: NftTraitSummaryDb | null = await this.nftTraitSummaryRepository.findOne({ where: { identifier: collection } });
      if (!summary) {
        return null;
      }

      return summary.traitTypes;
    } catch (error) {
      this.logger.error(`An unexpected error occurred when fetching NFT trait summary from DB for collection identifier '${collection}'`);
      this.logger.error(error);
      return null;
    }
  }

  async getSetting<T>(name: string): Promise<T | undefined> {
    try {
      const setting = await this.settingsRepository.findOne({ where: { name } });
      if (!setting) {
        return undefined;
      }

      return JSON.parse(setting.value) as T;
    } catch {
      return undefined;
    }
  }
}
