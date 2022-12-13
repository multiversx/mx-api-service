import { Inject, Injectable } from '@nestjs/common';
import { NftType } from 'src/endpoints/nfts/entities/nft.type';
import { NftService } from 'src/endpoints/nfts/nft.service';
import { ProcessNftSettings } from 'src/endpoints/process-nfts/entities/process.nft.settings';
import { NftWorkerService } from 'src/queue.worker/nft.worker/nft.worker.service';
import { CacheInfo } from '../../utils/cache.info';
import { NotifierEvent } from './entities/notifier.event';
import { BinaryUtils, CachingService } from '@elrondnetwork/erdnest';
import { IndexerService } from '../indexer/indexer.service';
import { OriginLogger } from '@elrondnetwork/erdnest';
import { EsdtService } from 'src/endpoints/esdt/esdt.service';
import { ClientProxy } from '@nestjs/microservices';

@Injectable()
export class RabbitMqNftHandlerService {
  private readonly logger = new OriginLogger(RabbitMqNftHandlerService.name);

  constructor(
    private readonly nftWorkerService: NftWorkerService,
    private readonly nftService: NftService,
    private readonly indexerService: IndexerService,
    private readonly cachingService: CachingService,
    private readonly esdtService: EsdtService,
    @Inject('PUBSUB_SERVICE') private clientProxy: ClientProxy,
  ) { }

  private async getCollectionType(collectionIdentifier: string): Promise<NftType | null> {
    const type = await this.cachingService.getCacheLocal<NftType>(CacheInfo.CollectionType(collectionIdentifier).key) ??
      await this.getCollectionTypeRaw(collectionIdentifier);

    if (!type) {
      return null;
    }

    await this.cachingService.setCacheLocal(
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
      await this.nftWorkerService.addProcessNftQueueJob(nft, new ProcessNftSettings({ forceRefreshMetadata: true }));
    } catch (error) {
      this.logger.error(`An unhandled error occurred when processing NFT update attributes event for NFT with identifier '${identifier}'`);
      this.logger.error(error);
    } finally {
      return true;
    }
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

  private getNftIdentifier(topics: string[]): string {
    const collection = BinaryUtils.base64Decode(topics[0]);
    const nonce = BinaryUtils.base64ToHex(topics[1]);

    return `${collection}-${nonce}`;
  }

  public async handleTransferOwnershipEvent(event: NotifierEvent): Promise<boolean> {
    const tokenIdentifier = BinaryUtils.base64Decode(event.topics[0]);

    try {
      const esdtProperties = await this.esdtService.getEsdtTokenPropertiesRaw(tokenIdentifier);
      if (!esdtProperties) {
        return false;
      }

      await this.invalidateKey(
        CacheInfo.EsdtProperties(tokenIdentifier).key,
        esdtProperties,
        CacheInfo.EsdtProperties(tokenIdentifier).ttl
      );

      return true;
    } catch (error) {
      this.logger.error(`An unhandled error occurred when processing transferOwnership event for token with identifier '${tokenIdentifier}'`);
      this.logger.error(error);

      return false;
    }
  }

  private async invalidateKey(key: string, data: any, ttl: number) {
    await this.cachingService.setCache(key, data, ttl);
    this.refreshCacheKey(key, ttl);
  }

  private refreshCacheKey(key: string, ttl: number) {
    this.clientProxy.emit('refreshCacheKey', { key, ttl });
  }
}
