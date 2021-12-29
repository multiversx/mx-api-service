import { Injectable, Logger } from "@nestjs/common";
import { ApiConfigService } from "src/common/api-config/api.config.service";
import { NftWorkerService } from "src/queue.worker/nft.worker/nft.worker.service";
import asyncPool from "tiny-async-pool";
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
  ) {
    this.logger = new Logger(ProcessNftsService.name);
  }

  async processCollection(collection: string, settings: ProcessNftSettings): Promise<{ [key: string]: boolean }> {
    let nfts = await this.nftService.getNfts({ from: 0, size: 10000 }, { collection });

    let results = await asyncPool(
      // this.apiConfigService.getPoolLimit(),
      1,
      nfts,
      async (nft: Nft) => await this.nftWorkerService.addProcessNftQueueJob(nft, settings)
    );

    let result: { [key: string]: boolean } = {};
    for (let [index, nft] of nfts.entries()) {
      result[nft.identifier] = results[index];
    }

    return result;
  }

  async processNft(identifier: string, settings: ProcessNftSettings): Promise<boolean> {
    const nft = await this.nftService.getSingleNft(identifier);
    if (!nft) {
      this.logger.error(`Could not get details for nft with identifier '${identifier}'`);
      return false;
    }

    return await this.nftWorkerService.addProcessNftQueueJob(nft, settings);
  }
}