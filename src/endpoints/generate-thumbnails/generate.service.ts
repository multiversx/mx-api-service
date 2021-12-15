import { Injectable } from "@nestjs/common";
import { ApiConfigService } from "src/common/api-config/api.config.service";
import { ApiService } from "src/common/network/api.service";
import { PluginService } from "src/common/plugins/plugin.service";
import asyncPool from "tiny-async-pool";
import { Nft } from "../nfts/entities/nft";
import { NftFilter } from "../nfts/entities/nft.filter";
import { NftService } from "../nfts/nft.service";

const GENERATE_MAX_SIZE = 10000;
@Injectable()
export class GenerateThumbnailService {
  constructor(
    private readonly apiConfigService: ApiConfigService,
    private readonly pluginService: PluginService,
    private readonly nftService: NftService,
  ) { }

  async generateThumbnails(collection?: string): Promise<void> {
    let nfts;
    if (collection) {
      nfts = await this.nftService.getNfts({ from: 0, size: GENERATE_MAX_SIZE }, { collection })
    }
    else {
      nfts = await this.nftService.getNfts({ from: 0, size: GENERATE_MAX_SIZE }, new NftFilter());
    }

    await asyncPool(
      this.apiConfigService.getPoolLimit(),
      nfts,
      async (nft: Nft) => await this.pluginService.generateThumbnails(nft)
    );
  }

  async generateThumbnailsForNft(identifier: string): Promise<void> {
    const nft: Nft | undefined = await this.nftService.getSingleNft(identifier);

    await this.pluginService.generateThumbnails(nft);
  }
}