import { Injectable } from '@nestjs/common';
import { NftType } from 'src/endpoints/nfts/entities/nft.type';
import { NftService } from 'src/endpoints/nfts/nft.service';
import { ProcessNftSettings } from 'src/endpoints/process-nfts/entities/process.nft.settings';
import { NftWorkerService } from 'src/queue.worker/nft.worker/nft.worker.service';
import { CacheInfo } from '../../utils/cache.info';
import { NotifierEvent } from './entities/notifier.event';
import { CacheService } from "@multiversx/sdk-nestjs-cache";
import { BinaryUtils, OriginLogger } from '@multiversx/sdk-nestjs-common';
import { IndexerService } from '../indexer/indexer.service';
import { NftSubType } from 'src/endpoints/nfts/entities/nft.sub.type';
import { Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';

@Injectable()
export class RabbitMqNftHandlerService {
  private readonly logger = new OriginLogger(RabbitMqNftHandlerService.name);

  constructor(
    private readonly nftWorkerService: NftWorkerService,
    private readonly nftService: NftService,
    private readonly indexerService: IndexerService,
    private readonly cachingService: CacheService,
    @Inject('PUBSUB_SERVICE') private clientProxy: ClientProxy,
  ) { }

  private async getCollectionType(collectionIdentifier: string): Promise<NftType | null> {
    const type = this.cachingService.getLocal<NftType>(CacheInfo.CollectionType(collectionIdentifier).key) ??
      await this.getCollectionTypeRaw(collectionIdentifier);

    if (!type) {
      return null;
    }

    this.cachingService.setLocal(
      CacheInfo.CollectionType(collectionIdentifier).key,
      type,
      CacheInfo.CollectionType(collectionIdentifier).ttl
    );

    return type;
  }

  private async getCollectionTypeRaw(collectionIdentifier: string): Promise<NftType | undefined> {
    const collection = await this.indexerService.getCollection(collectionIdentifier);
    if (!collection) {
      return undefined;
    }

    return collection.type as NftType;
  }

  public async handleNftUpdateAttributesEvent(event: NotifierEvent): Promise<boolean> {
    const identifier = this.getNftIdentifier(event.topics);
    const attributes = BinaryUtils.base64Decode(event.topics[3]);

    this.logger.log(`Detected 'ESDTNFTUpdateAttributes' event for NFT with identifier '${identifier}' and attributes '${attributes}'`);

    const nft = await this.nftService.getSingleNft(identifier);
    if (!nft) {
      this.logger.log(`Could not fetch NFT details for NFT with identifier '${identifier}'`);
      return false;
    }

    // we make sure the attributes from the event are used
    nft.attributes = attributes;

    try {
      const isDynamicNft = this.isDynamicNftType(nft.subType);

      if (isDynamicNft) {
        this.logger.log(`Processing dynamic NFT with identifier '${identifier}', forcing refresh of metadata and media`);

        await this.nftWorkerService.addProcessNftQueueJob(nft, new ProcessNftSettings({
          forceRefreshMetadata: true,
          forceRefreshMedia: true,
          forceRefreshThumbnail: true,
        }));
      } else {
        await this.nftWorkerService.addProcessNftQueueJob(nft, new ProcessNftSettings({ forceRefreshMetadata: true }));
      }
    } catch (error) {
      this.logger.error(`An unhandled error occurred when processing NFT update attributes event for NFT with identifier '${identifier}'`);
      this.logger.error(error);
    } finally {
      return true;
    }
  }

  private isDynamicNftType(subType?: NftSubType): boolean {
    if (subType) {
      return [
        NftSubType.DynamicNonFungibleESDT,
        NftSubType.DynamicSemiFungibleESDT,
        NftSubType.DynamicMetaESDT,
      ].includes(subType);
    }

    return false;
  }

  public async handleNftCreateEvent(event: NotifierEvent): Promise<boolean> {
    const identifier = this.getNftIdentifier(event.topics);

    const collectionIdentifier = identifier.split('-').slice(0, 2).join('-');
    const collectionType = await this.getCollectionType(collectionIdentifier);
    if (collectionType === NftType.MetaESDT) {
      return false;
    }

    this.logger.log(`Detected 'ESDTNFTCreate' event for NFT with identifier '${identifier}' and collection type '${collectionType}'`);

    // we wait for the transaction and its operations to be fully indexed
    await new Promise(resolve => setTimeout(resolve, 5000));

    const nft = await this.nftService.getSingleNft(identifier);
    if (!nft) {
      this.logger.log(`Could not fetch NFT details for NFT with identifier '${identifier}'`);
      return false;
    }

    try {
      const isDynamicNft = this.isDynamicNftType(nft.subType);

      if (isDynamicNft) {
        this.logger.log(`Processing dynamic NFT creation with identifier '${identifier}', forcing full refresh`);

        await this.nftWorkerService.addProcessNftQueueJob(nft, new ProcessNftSettings({
          uploadAsset: true,
          forceRefreshMetadata: true,
          forceRefreshMedia: true,
          forceRefreshThumbnail: true,
        }));

        return true;
      }

      const needsProcessing = await this.nftWorkerService.needsProcessing(nft, new ProcessNftSettings());
      if (needsProcessing) {
        await this.nftWorkerService.addProcessNftQueueJob(nft, new ProcessNftSettings({ uploadAsset: true }));
      }

      return true;
    } catch (error) {
      this.logger.error(`An unhandled error occurred when processing NFT Create event for NFT with identifier '${identifier}'`);
      this.logger.error(error);
      return false;
    }
  }

  public async handleNftBurnEvent(event: NotifierEvent): Promise<boolean> {
    const identifier = this.getNftIdentifier(event.topics);

    this.logger.log(`Detected 'ESDTNFTBurn' event for NFT with identifier '${identifier}'`);

    try {
      const cacheKey = `nft:${identifier}`;
      await this.cachingService.delete(cacheKey);

      this.clientProxy.emit('deleteCacheKeys', [cacheKey]);

      this.logger.log(`Cache invalidated for NFT with identifier '${identifier}' across all instances`);
      return true;
    } catch (error) {
      this.logger.error(`An unhandled error occurred when processing NFT Burn event for NFT with identifier '${identifier}'`);
      this.logger.error(error);
      return false;
    }
  }

  public async handleNftMetadataEvent(event: NotifierEvent): Promise<boolean> {
    const identifier = this.getNftIdentifier(event.topics);

    this.logger.log(`Detected '${event.identifier}' event for NFT with identifier '${identifier}'`);

    const nft = await this.nftService.getSingleNft(identifier);
    if (!nft) {
      this.logger.log(`Could not fetch NFT details for NFT with identifier '${identifier}'`);
      return false;
    }

    try {
      await this.nftWorkerService.addProcessNftQueueJob(nft, new ProcessNftSettings({
        forceRefreshMetadata: true,
        forceRefreshMedia: true,
      }));
      return true;
    } catch (error) {
      this.logger.error(`An unhandled error occurred when processing '${event.identifier}' event for NFT with identifier '${identifier}'`);
      this.logger.error(error);
      return false;
    }
  }

  public async handleNftModifyCreatorEvent(event: NotifierEvent): Promise<boolean> {
    const identifier = this.getNftIdentifier(event.topics);

    this.logger.log(`Detected 'ESDTModifyCreator' event for NFT with identifier '${identifier}'`);

    try {
      const cacheKey = `nft:${identifier}`;
      await this.cachingService.delete(cacheKey);

      this.clientProxy.emit('deleteCacheKeys', [cacheKey]);

      this.logger.log(`Cache invalidated for NFT with identifier '${identifier}' across all instances`);
      return true;
    } catch (error) {
      this.logger.error(`An unhandled error occurred when processing NFT ModifyCreator event for NFT with identifier '${identifier}'`);
      this.logger.error(error);
      return false;
    }
  }

  private getNftIdentifier(topics: string[]): string {
    const collection = BinaryUtils.base64Decode(topics[0]);
    const nonce = BinaryUtils.base64ToHex(topics[1]);

    return `${collection}-${nonce}`;
  }
}
