import configuration from "config/configuration";
import { ErrorLoggerAsync, PassthroughAsync } from "@multiversx/sdk-nestjs-common";
import { Injectable } from "@nestjs/common";
import { CollectionTrait } from "src/endpoints/collections/entities/collection.trait";
import { NftMedia } from "src/endpoints/nfts/entities/nft.media";
import { ObjectLiteral, Repository } from "typeorm";
import { NftMediaDb } from "./entities/nft.media.db";
import { NftMetadataDb } from "./entities/nft.metadata.db";
import { NftTraitSummaryDb } from "./entities/nft.trait.summary.db";
import { PersistenceInterface } from "./persistence.interface";
import { MetricsEvents } from "src/utils/metrics-events.constants";
import { LogPerformanceAsync } from "src/utils/log.performance.decorator";
import { KeybaseConfirmationDb } from "./entities/keybase.confirmation.db";
import { HotSwappableSettingDb } from "./entities/hot.swappable.setting";
import { InjectRepository } from "@nestjs/typeorm";

const isPassThrough = process.env.PERSISTENCE === 'passthrough' || configuration().database?.enabled === false;

@Injectable()
export class PersistenceService implements PersistenceInterface {
  constructor(
    @InjectRepository(NftMetadataDb)
    private readonly nftMetadataRepository: Repository<NftMetadataDb>,
    @InjectRepository(NftMediaDb)
    private readonly nftMediaRepository: Repository<NftMediaDb>,
    @InjectRepository(NftTraitSummaryDb)
    private readonly nftTraitSummaryRepository: Repository<NftTraitSummaryDb>,
    @InjectRepository(KeybaseConfirmationDb)
    private readonly keybaseConfirmationRepository: Repository<KeybaseConfirmationDb>,
    @InjectRepository(HotSwappableSettingDb)
    private readonly settingsRepository: Repository<HotSwappableSettingDb>,
  ) { }

  @PassthroughAsync(isPassThrough, null)
  @LogPerformanceAsync(MetricsEvents.SetPersistenceDuration, 'getMetadata')
  @ErrorLoggerAsync({ logArgs: true })
  async getMetadata(identifier: string): Promise<any | null> {
    const metadataDb: NftMetadataDb | null = await this.nftMetadataRepository.findOne({ where: { id: identifier } });
    if (!metadataDb) {
      return null;
    }

    return metadataDb.content;
  }

  @PassthroughAsync(isPassThrough, {})
  @LogPerformanceAsync(MetricsEvents.SetPersistenceDuration, 'batchGetMetadata')
  @ErrorLoggerAsync({ logArgs: true })
  async batchGetMetadata(identifiers: string[]): Promise<Record<string, any>> {
    const metadatasDb = await this.nftMetadataRepository.find({
      where: {
        id: {
          // @ts-ignore
          $in: identifiers,
        },
      },
    });

    return metadatasDb.toRecord(metadata => metadata.id, metadata => metadata.content);
  }

  @PassthroughAsync(isPassThrough)
  @LogPerformanceAsync(MetricsEvents.SetPersistenceDuration, 'setMetadata')
  @ErrorLoggerAsync()
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

  @PassthroughAsync(isPassThrough, {})
  @LogPerformanceAsync(MetricsEvents.SetPersistenceDuration, 'deleteMetadata')
  @ErrorLoggerAsync()
  async deleteMetadata(identifier: string): Promise<any> {
    return await this.nftMetadataRepository.delete({ id: identifier });
  }

  @PassthroughAsync(isPassThrough, {})
  @LogPerformanceAsync(MetricsEvents.SetPersistenceDuration, 'getMedia')
  @ErrorLoggerAsync({ logArgs: true })
  async getMedia(identifier: string): Promise<NftMedia[] | null> {
    const media: NftMediaDb | null = await this.nftMediaRepository.findOne({ where: { id: identifier } });
    if (!media) {
      return null;
    }

    return media.content;
  }

  @PassthroughAsync(isPassThrough, {})
  @LogPerformanceAsync(MetricsEvents.SetPersistenceDuration, 'batchGetMedia')
  @ErrorLoggerAsync({ logArgs: true })
  async batchGetMedia(identifiers: string[]): Promise<Record<string, NftMedia[]>> {
    const mediasDb = await this.nftMediaRepository.find({
      where: {
        id: {
          // @ts-ignore
          $in: identifiers,
        },
      },
    });

    return mediasDb.toRecord(media => media.id ?? '', media => media.content);
  }

  @PassthroughAsync(isPassThrough)
  @LogPerformanceAsync(MetricsEvents.SetPersistenceDuration, 'setMedia')
  @ErrorLoggerAsync()
  async setMedia(identifier: string, media: NftMedia[]): Promise<void> {
    let value = await this.nftMediaRepository.findOne({ where: { id: identifier } });
    if (!value) {
      value = new NftMediaDb();
    }

    value.id = identifier;
    value.content = media;

    await this.save(this.nftMediaRepository, value);
  }

  @PassthroughAsync(isPassThrough, null)
  @LogPerformanceAsync(MetricsEvents.SetPersistenceDuration, 'getCollectionTraits')
  @ErrorLoggerAsync({ logArgs: true })
  async getCollectionTraits(collection: string): Promise<CollectionTrait[] | null> {
    const summary: NftTraitSummaryDb | null = await this.nftTraitSummaryRepository.findOne({ where: { identifier: collection } });
    if (!summary) {
      return null;
    }

    return summary.traitTypes;
  }

  @PassthroughAsync(isPassThrough, null)
  @LogPerformanceAsync(MetricsEvents.SetPersistenceDuration, 'getKeybaseConfirmationForIdentity')
  @ErrorLoggerAsync({ logArgs: true })
  async getKeybaseConfirmationForIdentity(identity: string): Promise<string[] | undefined> {
    const keybaseConfirmation: KeybaseConfirmationDb | null = await this.keybaseConfirmationRepository.findOne({ where: { identity } });
    if (!keybaseConfirmation) {
      return undefined;
    }

    return keybaseConfirmation.keys;
  }

  @PassthroughAsync(isPassThrough, null)
  @LogPerformanceAsync(MetricsEvents.SetPersistenceDuration, 'setKeybaseConfirmationForIdentity')
  @ErrorLoggerAsync({ logArgs: true })
  async setKeybaseConfirmationForIdentity(identity: string, keys: string[]): Promise<void> {
    let keybaseConfirmation = await this.keybaseConfirmationRepository.findOne({ where: { identity } });
    if (!keybaseConfirmation) {
      keybaseConfirmation = new KeybaseConfirmationDb();
    }

    keybaseConfirmation.identity = identity;
    keybaseConfirmation.keys = keys;

    await this.save(this.keybaseConfirmationRepository, keybaseConfirmation);
  }

  @PassthroughAsync(isPassThrough, null)
  @LogPerformanceAsync(MetricsEvents.SetPersistenceDuration, 'getSetting')
  @ErrorLoggerAsync({ logArgs: true })
  async getSetting<T>(name: string): Promise<T | undefined> {
    const setting = await this.settingsRepository.findOne({ where: { name } });
    if (!setting) {
      return undefined;
    }

    return JSON.parse(setting.value) as T;
  }

  @PassthroughAsync(isPassThrough, null)
  @LogPerformanceAsync(MetricsEvents.SetPersistenceDuration, 'setSetting')
  @ErrorLoggerAsync({ logArgs: true })
  async setSetting<T>(name: string, value: T): Promise<void> {
    let item = await this.settingsRepository.findOne({ where: { name } });
    if (!item) {
      item = new HotSwappableSettingDb();
    }

    item.name = name;
    item.value = value;

    await this.save(this.settingsRepository, item);
  }

  @PassthroughAsync(isPassThrough, null)
  @LogPerformanceAsync(MetricsEvents.SetPersistenceDuration, 'getAllSettings')
  @ErrorLoggerAsync({ logArgs: true })
  async getAllSettings(): Promise<{ name: string, value: any }[]> {
    const settings = await this.settingsRepository.find();
    return settings.map(setting => ({
      name: setting.name,
      value: setting.value,
    }));
  }
}
