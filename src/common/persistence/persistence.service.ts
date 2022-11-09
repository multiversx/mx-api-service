import { ErrorLoggerAsync, PassthroughAsync } from "@elrondnetwork/erdnest";
import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import configuration from "config/configuration";
import { CollectionTrait } from "src/endpoints/collections/entities/collection.trait";
import { NftMedia } from "src/endpoints/nfts/entities/nft.media";
import { ObjectLiteral, Repository } from "typeorm";
import { NftMediaDb } from "./entities/nft.media.db";
import { NftMetadataDb } from "./entities/nft.metadata.db";
import { NftTraitSummaryDb } from "./entities/nft.trait.summary.db";
import { PersistenceInterface } from "./persistence.interface";
import { LogPerformanceAsync } from "../../decorators/log.performance.decorators";

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
  ) { }

  @PassthroughAsync(isPassThrough, null)
  @LogPerformanceAsync('setPersistenceDuration', 'getMetadata')
  @ErrorLoggerAsync({ logArgs: true })
  async getMetadata(identifier: string): Promise<any | null> {
    const metadataDb: NftMetadataDb | null = await this.nftMetadataRepository.findOne({ where: { id: identifier } });
    if (!metadataDb) {
      return null;
    }

    return metadataDb.content;
  }

  @PassthroughAsync(isPassThrough, {})
  @LogPerformanceAsync('setPersistenceDuration', 'batchGetMetadata')
  @ErrorLoggerAsync({ logArgs: true })
  async batchGetMetadata(identifiers: string[]): Promise<Record<string, any>> {
    console.log('execute batchGetMetadata');
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
  @LogPerformanceAsync('setPersistenceDuration', 'setMetadata')
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
  @LogPerformanceAsync('setPersistenceDuration', 'deleteMetadata')
  @ErrorLoggerAsync()
  async deleteMetadata(identifier: string): Promise<any> {
    return await this.nftMetadataRepository.delete({ id: identifier });
  }

  @PassthroughAsync(isPassThrough, {})
  @LogPerformanceAsync('setPersistenceDuration', 'getMedia')
  @ErrorLoggerAsync({ logArgs: true })
  async getMedia(identifier: string): Promise<NftMedia[] | null> {
    const media: NftMediaDb | null = await this.nftMediaRepository.findOne({ where: { id: identifier } });
    if (!media) {
      return null;
    }

    return media.content;
  }

  @PassthroughAsync(isPassThrough, {})
  @LogPerformanceAsync('setPersistenceDuration', 'batchGetMedia')
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
  @LogPerformanceAsync('setPersistenceDuration', 'setMedia')
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
  @LogPerformanceAsync('setPersistenceDuration', 'getCollectionTraits')
  @ErrorLoggerAsync({ logArgs: true })
  async getCollectionTraits(collection: string): Promise<CollectionTrait[] | null> {
    const summary: NftTraitSummaryDb | null = await this.nftTraitSummaryRepository.findOne({ where: { identifier: collection } });
    if (!summary) {
      return null;
    }

    return summary.traitTypes;
  }
}
