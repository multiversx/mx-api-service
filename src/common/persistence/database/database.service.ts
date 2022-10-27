import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { NftMedia } from "src/endpoints/nfts/entities/nft.media";
import { NftMediaDb } from "src/common/persistence/database/entities/nft.media.db";
import { NftMetadataDb } from "src/common/persistence/database/entities/nft.metadata.db";
import { Repository } from "typeorm";
import { PersistenceInterface } from "../persistence.interface";
import { OriginLogger } from "@elrondnetwork/erdnest";
import { CollectionTraitSummary } from "src/common/indexer/entities/collection.trait.summary";
import { SettingDb } from "./entities/setting.db";

@Injectable()
export class DatabaseService implements PersistenceInterface {
  private readonly logger = new OriginLogger(DatabaseService.name);

  constructor(
    @InjectRepository(NftMetadataDb)
    private readonly nftMetadataRepository: Repository<NftMetadataDb>,
    @InjectRepository(NftMediaDb)
    private readonly nftMediaRepository: Repository<NftMediaDb>,
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
      const metadatasDb = await this.nftMetadataRepository.findByIds(identifiers);

      return metadatasDb.toRecord(metadata => metadata.id, metadata => metadata.content);
    } catch (error) {
      this.logger.log(`Error when getting metadata from DB for batch '${identifiers}'`);
      this.logger.error(error);

      return {};
    }
  }

  async setMetadata(identifier: string, content: any): Promise<void> {
    const metadata = new NftMetadataDb();
    metadata.id = identifier;
    metadata.content = content;

    await this.nftMetadataRepository.save(metadata);
  }

  async deleteMetadata(identifier: string): Promise<void> {
    try {
      await this.nftMetadataRepository.delete(identifier);
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
      const mediasDb = await this.nftMediaRepository.findByIds(identifiers);

      return mediasDb.toRecord(media => media.id ?? '', media => media.content);
    } catch (error) {
      this.logger.log(`Error when getting media from DB for batch '${identifiers}'`);
      this.logger.error(error);

      return {};
    }
  }

  async setMedia(identifier: string, media: NftMedia[]): Promise<void> {
    const value = new NftMediaDb();
    value.id = identifier;
    value.content = media;

    await this.nftMediaRepository.save(value);
  }

  // eslint-disable-next-line require-await
  async getCollectionTraits(_collection: string): Promise<CollectionTraitSummary[] | null> {
    return null;
  }

  async getSetting<T>(name: string): Promise<T | undefined> {
    try {
      const setting = await this.settingsRepository.findOne({ where: { id: name } });
      if (!setting) {
        return undefined;
      }

      return JSON.parse(setting.value) as T;
    } catch {
      return undefined;
    }
  }

  async getAllSettings(): Promise<{ name: string, value: any }[]> {
    try {
      const settings = await this.settingsRepository.find();
      return settings.map(setting => ({
        name: setting.id ?? '',
        value: JSON.parse(setting.value),
      }));
    } catch {
      return [];
    }
  }
}
