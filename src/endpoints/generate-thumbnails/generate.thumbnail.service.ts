import { Injectable } from "@nestjs/common";
import { ApiConfigService } from "src/common/api-config/api.config.service";
import { NftWorkerService } from "src/queue.worker/nft.worker/nft.worker.service";
import asyncPool from "tiny-async-pool";
import { Nft } from "../nfts/entities/nft";
import { NftService } from "../nfts/nft.service";

@Injectable()
export class GenerateThumbnailService {
  constructor(
    private readonly apiConfigService: ApiConfigService,
    private readonly nftWorkerService: NftWorkerService,
    private readonly nftService: NftService,
  ) { }

  async generateThumbnails(collection: string): Promise<void> {
    let nfts = await this.nftService.getNfts({ from: 0, size: 10000 }, { collection });

    await asyncPool(
      this.apiConfigService.getPoolLimit(),
      nfts,
      async (nft: Nft) => await this.nftWorkerService.addNftQueueJob(nft)
    );
  }

  async generateThumbnailsForNft(identifier: string): Promise<void> {
    const nft = await this.nftService.getSingleNft(identifier);

    await this.nftWorkerService.addNftQueueJob(nft);
  }
}