import { Injectable, Logger } from "@nestjs/common";
import { ApiConfigService } from "src/common/api-config/api.config.service";
import { NftWorkerService } from "src/queue.worker/nft.worker/nft.worker.service";
import asyncPool from "tiny-async-pool";
import { CollectionService } from "../collections/collection.service";
import { CollectionFilter } from "../collections/entities/collection.filter";
import { NftCollection } from "../collections/entities/nft.collection";
import { Nft } from "../nfts/entities/nft";
import { NftService } from "../nfts/nft.service";
import { ProcessNftSettings } from "./entities/process.nft.settings";

@Injectable()
export class ProcessNftsService {
  private readonly logger: Logger;

  constructor(
    private readonly apiConfigService: ApiConfigService,
    private readonly nftWorkerService: NftWorkerService,
    private readonly nftService: NftService,
    private readonly collectionService: CollectionService,
  ) {
    this.logger = new Logger(ProcessNftsService.name);
  }

  async processCollection(collection: string, settings: ProcessNftSettings): Promise<void> {
    let nfts = await this.nftService.getNfts({ from: 0, size: 10000 }, { collection });

    await asyncPool(
      this.apiConfigService.getPoolLimit(),
      nfts,
      async (nft: Nft) => await this.nftWorkerService.addProcessNftQueueJob(nft, settings)
    );
  }

  async processAllCollections(settings: ProcessNftSettings): Promise<void> {
    let collections = await this.collectionService.getNftCollections({ from: 0, size: 10000 }, new CollectionFilter());

    await asyncPool(
      this.apiConfigService.getPoolLimit(),
      collections,
      async (collection: NftCollection) => await this.processCollection(collection.ticker, settings)
    );
  }

  async processNft(identifier: string, settings: ProcessNftSettings): Promise<void> {
    const nft = await this.nftService.getSingleNft(identifier);
    if (!nft) {
      this.logger.error(`Could not get details for nft with identifier '${identifier}'`);
      return;
    }

    await this.nftWorkerService.addProcessNftQueueJob(nft, settings);
  }
}