import { HttpException, HttpStatus, Injectable, Logger } from "@nestjs/common";
import { ApiConfigService } from "src/common/api-config/api.config.service";
import { CachingService } from "src/common/caching/caching.service";
import { CacheInfo } from "src/common/caching/entities/cache.info";
import { GatewayComponentRequest } from "src/common/gateway/entities/gateway.component.request";
import { GatewayService } from "src/common/gateway/gateway.service";
import { NftWorkerService } from "src/queue.worker/nft.worker/nft.worker.service";
import { AddressUtils } from "src/utils/address.utils";
import asyncPool from "tiny-async-pool";
import { CollectionService } from "../collections/collection.service";
import { Nft } from "../nfts/entities/nft";
import { NftService } from "../nfts/nft.service";
import { ProcessNftRequest } from "./entities/process.nft.request";
import { ProcessNftSettings } from "./entities/process.nft.settings";

@Injectable()
export class ProcessNftsService {
  public static readonly MAX_DEPTH = 10;

  private readonly logger: Logger;

  constructor(
    private readonly apiConfigService: ApiConfigService,
    private readonly nftWorkerService: NftWorkerService,
    private readonly nftService: NftService,
    private readonly collectionService: CollectionService,
    private readonly gatewayService: GatewayService,
    private readonly cachingService: CachingService,
  ) {
    this.logger = new Logger(ProcessNftsService.name);
  }

  public async generateThumbnails(processNftRequest: ProcessNftRequest) {
    const settings = ProcessNftSettings.fromRequest(processNftRequest);

    if (processNftRequest.collection) {
      return await this.processCollection(processNftRequest.collection, settings);
    } else if (processNftRequest.identifier) {
      const processed = await this.processNft(processNftRequest.identifier, settings);

      const result: { [key: string]: boolean } = {};
      result[processNftRequest.identifier] = processed;

      return result;
    } else {
      throw new HttpException('Provide an identifier or a collection to generate thumbnails for', HttpStatus.BAD_REQUEST);
    }
  }

  public async generateThumbnailsAsOwner(address: string, processNftRequest: ProcessNftRequest) {
    const collectionOrIdentifier = processNftRequest.identifier ?? processNftRequest.collection ?? '';

    const wasProcessed = await this.cachingService.getCache<boolean>(CacheInfo.GenerateThumbnails(collectionOrIdentifier).key);
    if (wasProcessed) {
      throw new HttpException('Thumbnails have already been generated', HttpStatus.TOO_MANY_REQUESTS);
    }

    await this.checkNftOrCollectionOwner(address, processNftRequest.collection, processNftRequest.identifier);

    const result = await this.generateThumbnails(processNftRequest);

    await this.cachingService.setCache(CacheInfo.GenerateThumbnails(collectionOrIdentifier).key, true, CacheInfo.GenerateThumbnails(collectionOrIdentifier).ttl);

    return result;
  }

  private async processCollection(collection: string, settings: ProcessNftSettings): Promise<{ [key: string]: boolean }> {
    const nfts = await this.nftService.getNfts({ from: 0, size: 10000 }, { collection });

    const results = await asyncPool(
      this.apiConfigService.getPoolLimit(),
      nfts,
      async (nft: Nft) => await this.nftWorkerService.addProcessNftQueueJob(nft, settings)
    );

    const result: { [key: string]: boolean } = {};
    for (const [index, nft] of nfts.entries()) {
      result[nft.identifier] = results[index];
    }

    return result;
  }

  private async processNft(identifier: string, settings: ProcessNftSettings): Promise<boolean> {
    const nft = await this.nftService.getSingleNft(identifier);
    if (!nft) {
      this.logger.error(`Could not get details for nft with identifier '${identifier}'`);
      return false;
    }

    return await this.nftWorkerService.addProcessNftQueueJob(nft, settings);
  }

  private async checkNftOrCollectionOwner(address: string, collection?: string, identifier?: string): Promise<void> {
    if (identifier) {
      const nft = await this.nftService.getSingleNft(identifier);
      if (!nft) {
        throw new HttpException('Provide a valid identifier or a collection to generate thumbnails for', HttpStatus.BAD_REQUEST);
      }

      collection = nft.collection;
    }

    if (!collection) {
      throw new HttpException('Provide a valid identifier or a collection to generate thumbnails for', HttpStatus.BAD_REQUEST);
    }

    const nftCollection = await this.collectionService.getNftCollection(collection);
    if (!nftCollection) {
      throw new HttpException('Provide a valid identifier or a collection to generate thumbnails for', HttpStatus.BAD_REQUEST);
    }

    if (!nftCollection.owner) {
      throw new HttpException(`The owner's address could not be found`, HttpStatus.BAD_REQUEST);
    }

    let collectionOwner = nftCollection.owner;

    let currentDepth = 0;
    while (AddressUtils.isSmartContractAddress(collectionOwner) && currentDepth < ProcessNftsService.MAX_DEPTH) {
      const {
        account: { ownerAddress },
      } = await this.gatewayService.get(`address/${collectionOwner}`, GatewayComponentRequest.addressDetails);

      currentDepth++;
      collectionOwner = ownerAddress;
    }

    if (AddressUtils.isSmartContractAddress(collectionOwner)) {
      throw new HttpException(`The owner's address could not be found`, HttpStatus.BAD_REQUEST);
    }

    if (address !== collectionOwner) {
      throw new HttpException('Only the collection owner can generate thumbnails', HttpStatus.FORBIDDEN);
    }
  }
}
