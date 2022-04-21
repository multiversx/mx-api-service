import { Injectable, Logger } from '@nestjs/common';
import { NftType } from 'src/endpoints/nfts/entities/nft.type';
import { NftService } from 'src/endpoints/nfts/nft.service';
import { ProcessNftSettings } from 'src/endpoints/process-nfts/entities/process.nft.settings';
import { NftWorkerService } from 'src/queue.worker/nft.worker/nft.worker.service';
import { CachingService } from '../caching/caching.service';
import { CacheInfo } from '../caching/entities/cache.info';
import { ElasticService } from '../elastic/elastic.service';
import { NftCreateEvent } from './entities/nft/nft-create.event';

@Injectable()
export class RabbitMqNftHandlerService {
  private readonly logger: Logger;

  constructor(
    private readonly nftWorkerService: NftWorkerService,
    private readonly nftService: NftService,
    private readonly elasticService: ElasticService,
    private readonly cachingService: CachingService,
  ) {
    this.logger = new Logger(RabbitMqNftHandlerService.name);
  }

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
    const collection = await this.elasticService.getItem('tokens', '_id', collectionIdentifier);
    if (!collection) {
      return undefined;
    }

    this.logger.log(`Collection type for collection with identifier '${collectionIdentifier}' is '${collection.type}'`);

    return collection.type;
  }

  public async handleNftCreateEvent(event: NftCreateEvent): Promise<void> {
    const identifier = event.getTopics()?.identifier;
    if (!identifier) {
      this.logger.error(`Could not extract identifier from NFT create event '${JSON.stringify(event)}'`);
      return;
    }

    const collectionIdentifier = identifier.split('-').slice(0, 2).join('-');
    const collectionType = await this.getCollectionType(collectionIdentifier);
    if (collectionType === NftType.MetaESDT) {
      this.logger.log(`Skipped 'ESDTNFTCreate' event for NFT with identifier '${identifier}'`);
      return;
    }

    this.logger.log(`Detected 'ESDTNFTCreate' event for NFT with identifier '${identifier}' and collection type '${collectionType}'`);

    // we wait for the transaction and its operations to be fully indexed
    await new Promise(resolve => setTimeout(resolve, 5000));

    const nft = await this.nftService.getSingleNft(identifier);
    if (!nft) {
      this.logger.log(`Could not fetch NFT details for NFT with identifier '${identifier}'`);
      return;
    }

    try {
      const needsProcessing = await this.nftWorkerService.needsProcessing(nft, new ProcessNftSettings());
      if (needsProcessing) {
        await this.nftWorkerService.addProcessNftQueueJob(nft, new ProcessNftSettings());
      }
    } catch (error) {
      this.logger.error(`An unhandled error occurred when processing NFT with identifier '${identifier}'`);
      this.logger.error(error);
    }
  }
}
