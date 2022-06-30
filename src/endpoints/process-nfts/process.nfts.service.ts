import { AddressUtils, CachingService } from "@elrondnetwork/erdnest-common";
import { Injectable, Logger } from "@nestjs/common";
import { ApiConfigService } from "src/common/api-config/api.config.service";
import { CacheInfo } from "src/utils/cache.info";
import { NftWorkerService } from "src/queue.worker/nft.worker/nft.worker.service";
import asyncPool from "tiny-async-pool";
import { AccountService } from "../accounts/account.service";
import { CollectionService } from "../collections/collection.service";
import { Nft } from "../nfts/entities/nft";
import { NftService } from "../nfts/nft.service";
import { ProcessNftRequest } from "./entities/process.nft.request";
import { ProcessNftSettings } from "./entities/process.nft.settings";

@Injectable()
export class ProcessNftsService {
  private static readonly MAX_DEPTH = 10;
  private static readonly MAXIMUM_PROCESS_RETRIES = 2;

  private readonly logger: Logger;

  constructor(
    private readonly apiConfigService: ApiConfigService,
    private readonly nftWorkerService: NftWorkerService,
    private readonly nftService: NftService,
    private readonly collectionService: CollectionService,
    private readonly accountService: AccountService,
    private readonly cachingService: CachingService,
  ) {
    this.logger = new Logger(ProcessNftsService.name);
  }

  public async process(processNftRequest: ProcessNftRequest) {
    const settings = ProcessNftSettings.fromRequest(processNftRequest);

    if (processNftRequest.collection) {
      return await this.processCollection(processNftRequest.collection, settings);
    } else if (processNftRequest.identifier) {
      const processed = await this.processNft(processNftRequest.identifier, settings);

      const result: { [key: string]: boolean } = {};
      result[processNftRequest.identifier] = processed;

      return result;
    } else {
      throw new Error('Provide an identifier or a collection to generate thumbnails for');
    }
  }

  public async processWithOwnerCheck(address: string, processNftRequest: ProcessNftRequest) {
    const collectionOrIdentifier = processNftRequest.identifier ?? processNftRequest.collection;
    if (!collectionOrIdentifier) {
      throw new Error('No collection or identifier has been provided');
    }

    const generateRetries = await this.cachingService.incrementRemote(CacheInfo.GenerateThumbnails(collectionOrIdentifier).key);
    if (generateRetries > ProcessNftsService.MAXIMUM_PROCESS_RETRIES) {
      throw new Error('Thumbnails have already been generated');
    }

    const collection = collectionOrIdentifier.split('-').slice(0, 2).join('-');

    const isCollectionOwner = await this.isCollectionOwner(address, collection);
    if (!isCollectionOwner) {
      throw new Error(`Provided address '${address}' is not collection owner`);
    }

    const result = await this.process(processNftRequest);

    return result;
  }

  public async processCollection(collection: string, settings: ProcessNftSettings): Promise<{ [key: string]: boolean }> {
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

  public async processNft(identifier: string, settings: ProcessNftSettings): Promise<boolean> {
    const nft = await this.nftService.getSingleNft(identifier);
    if (!nft) {
      this.logger.error(`Could not get details for nft with identifier '${identifier}'`);
      return false;
    }

    return await this.nftWorkerService.addProcessNftQueueJob(nft, settings);
  }

  private async isCollectionOwner(address: string, collection: string): Promise<boolean> {
    const collectionOwner = await this.getCollectionNonScOwner(collection);

    return address === collectionOwner;
  }

  private async getCollectionNonScOwner(collection: string): Promise<string> {
    return await this.cachingService.getOrSetCache(
      CacheInfo.CollectionNonScOwner(collection).key,
      async () => await this.getCollectionNonScOwnerRaw(collection),
      CacheInfo.CollectionNonScOwner(collection).ttl,
    );
  }

  private async getCollectionNonScOwnerRaw(collection: string): Promise<string> {
    const nftCollection = await this.collectionService.getNftCollection(collection);
    if (!nftCollection) {
      throw new Error(`NFT Collection with identifier '${collection}' not found`);
    }

    if (!nftCollection.owner) {
      throw new Error(`NFT Collection with identifier '${collection}' does not have any owner`);
    }

    let collectionOwner = nftCollection.owner;

    let currentDepth = 0;
    while (AddressUtils.isSmartContractAddress(collectionOwner) && currentDepth < ProcessNftsService.MAX_DEPTH) {
      const account = await this.accountService.getAccount(collectionOwner);
      if (!account) {
        throw new Error(`Could not fetch account details for address '${collectionOwner}'`);
      }

      currentDepth++;
      collectionOwner = account.ownerAddress;
    }

    if (AddressUtils.isSmartContractAddress(collectionOwner)) {
      throw new Error(`Collection owner '${collectionOwner}' should not be smart contract`);
    }

    return collectionOwner;
  }
}
