import { ErrorLoggerAsync } from "@elrondnetwork/erdnest";
import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { CollectionTrait } from "src/endpoints/collections/entities/collection.trait";
import { NftMedia } from "src/endpoints/nfts/entities/nft.media";
import { ObjectLiteral, Repository } from "typeorm";
import { PersistenceInterface } from "../persistence.interface";
import { NftMediaDb } from "./entities/nft.media.db";
import { NftMetadataDb } from "./entities/nft.metadata.db";
import { NftTraitSummaryDb } from "./entities/nft.trait.summary.db";

@Injectable()
export class MongoDbService implements PersistenceInterface {

  constructor(
    @InjectRepository(NftMetadataDb)
    private readonly nftMetadataRepository: Repository<NftMetadataDb>,
    @InjectRepository(NftMediaDb)
    private readonly nftMediaRepository: Repository<NftMediaDb>,
    @InjectRepository(NftTraitSummaryDb)
    private readonly nftTraitSummaryRepository: Repository<NftTraitSummaryDb>,
  ) { }

  @ErrorLoggerAsync({ logArgs: true })
  async getMetadata(identifier: string): Promise<any | null> {
    const metadataDb: NftMetadataDb | null = await this.nftMetadataRepository.findOne({ where: { id: identifier } });
    if (!metadataDb) {
      return null;
    }

    return metadataDb.content;
  }

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

  @ErrorLoggerAsync()
  async deleteMetadata(identifier: string): Promise<any> {
    return await this.nftMetadataRepository.delete({ id: identifier });
  }

  @ErrorLoggerAsync({ logArgs: true })
  async getMedia(identifier: string): Promise<NftMedia[] | null> {
    const media: NftMediaDb | null = await this.nftMediaRepository.findOne({ where: { id: identifier } });
    if (!media) {
      return null;
    }

    return media.content;
  }

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

  @ErrorLoggerAsync({ logArgs: true })
  async getCollectionTraits(collection: string): Promise<CollectionTrait[] | null> {
    const summary: NftTraitSummaryDb | null = await this.nftTraitSummaryRepository.findOne({ where: { identifier: collection } });
    if (!summary) {
      return null;
    }

    return summary.traitTypes;
  }
}
