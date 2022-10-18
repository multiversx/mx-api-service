import { forwardRef, Inject, Injectable } from "@nestjs/common";
import { Histogram } from "prom-client";
import { GatewayComponentRequest } from "../gateway/entities/gateway.component.request";
import { GatewayService } from "../gateway/gateway.service";
import { ProtocolService } from "../protocol/protocol.service";

@Injectable()
export class ApiStatusCheckerService {
  private static accountsCountHistogram: Histogram<string>;
  private static blocksCountHistogram: Histogram<string>;
  private static collectionsCountHistogram: Histogram<string>;
  private static nftsCountHistogram: Histogram<string>;
  private static tagsCountHistogram: Histogram<string>;
  private static roundsCountHistogram: Histogram<string>;
  private static resultsCountHistogram: Histogram<string>;
  private static tokensCountHistogram: Histogram<string>;
  private static transactionsCountHistogram: Histogram<string>;
  private static transferCountHistogram: Histogram<string>;
  private static shard_metachain_RoundsHistogram: Histogram<string>;
  private static shard_0_RoundsHistogram: Histogram<string>;
  private static shard_1_RoundsHistogram: Histogram<string>;
  private static shard_2_RoundsHistogram: Histogram<string>;

  constructor(
    @Inject(forwardRef(() => GatewayService))
    private readonly gatewayService: GatewayService,
    private readonly protocolService: ProtocolService,
  ) {
    if (!ApiStatusCheckerService.accountsCountHistogram) {
      ApiStatusCheckerService.accountsCountHistogram = new Histogram({
        name: 'total_accounts',
        help: 'total_accounts',
        labelNames: [],
        buckets: [],
      });
    }

    if (!ApiStatusCheckerService.blocksCountHistogram) {
      ApiStatusCheckerService.blocksCountHistogram = new Histogram({
        name: 'total_blocks',
        help: 'total_blocks',
        labelNames: [],
        buckets: [],
      });
    }

    if (!ApiStatusCheckerService.collectionsCountHistogram) {
      ApiStatusCheckerService.collectionsCountHistogram = new Histogram({
        name: 'total_collections',
        help: 'total_collections',
        labelNames: [],
        buckets: [],
      });
    }

    if (!ApiStatusCheckerService.nftsCountHistogram) {
      ApiStatusCheckerService.nftsCountHistogram = new Histogram({
        name: 'total_nfts',
        help: 'total_nfts',
        labelNames: [],
        buckets: [],
      });
    }

    if (!ApiStatusCheckerService.tagsCountHistogram) {
      ApiStatusCheckerService.tagsCountHistogram = new Histogram({
        name: 'total_tags',
        help: 'total_tags',
        labelNames: [],
        buckets: [],
      });
    }

    if (!ApiStatusCheckerService.roundsCountHistogram) {
      ApiStatusCheckerService.roundsCountHistogram = new Histogram({
        name: 'total_rounds',
        help: 'total_rounds',
        labelNames: [],
        buckets: [],
      });
    }

    if (!ApiStatusCheckerService.resultsCountHistogram) {
      ApiStatusCheckerService.resultsCountHistogram = new Histogram({
        name: 'total_scResults',
        help: 'total_scResults',
        labelNames: [],
        buckets: [],
      });
    }

    if (!ApiStatusCheckerService.tokensCountHistogram) {
      ApiStatusCheckerService.tokensCountHistogram = new Histogram({
        name: 'total_tokens',
        help: 'total_tokens',
        labelNames: [],
        buckets: [],
      });
    }

    if (!ApiStatusCheckerService.transferCountHistogram) {
      ApiStatusCheckerService.transferCountHistogram = new Histogram({
        name: 'total_transfers',
        help: 'total_transfers',
        labelNames: [],
        buckets: [],
      });
    }

    if (!ApiStatusCheckerService.shard_0_RoundsHistogram) {
      ApiStatusCheckerService.shard_0_RoundsHistogram = new Histogram({
        name: 'shard_0_rounds',
        help: 'shard_0_rounds',
        labelNames: [],
        buckets: [],
      });
    }

    if (!ApiStatusCheckerService.shard_1_RoundsHistogram) {
      ApiStatusCheckerService.shard_1_RoundsHistogram = new Histogram({
        name: 'shard_1_rounds',
        help: 'shard_1_rounds',
        labelNames: [],
        buckets: [],
      });
    }

    if (!ApiStatusCheckerService.shard_2_RoundsHistogram) {
      ApiStatusCheckerService.shard_2_RoundsHistogram = new Histogram({
        name: 'shard_2_rounds',
        help: 'shard_2_rounds',
        labelNames: [],
        buckets: [],
      });
    }

    if (!ApiStatusCheckerService.shard_metachain_RoundsHistogram) {
      ApiStatusCheckerService.shard_metachain_RoundsHistogram = new Histogram({
        name: 'shard_4294967295_rounds',
        help: 'shard_4294967295_rounds',
        labelNames: [],
        buckets: [],
      });
    }
  }

  setAccountsCount(count: number) {
    ApiStatusCheckerService.accountsCountHistogram.labels().observe(count);
  }

  blocksCountHistogram(count: number) {
    ApiStatusCheckerService.blocksCountHistogram.labels().observe(count);
  }

  collectionsCountHistogram(count: number) {
    ApiStatusCheckerService.collectionsCountHistogram.labels().observe(count);
  }

  nftsCountHistogram(count: number) {
    ApiStatusCheckerService.nftsCountHistogram.labels().observe(count);
  }

  tagsCountHistogram(count: number) {
    ApiStatusCheckerService.tagsCountHistogram.labels().observe(count);
  }

  roundsCountHistogram(count: number) {
    ApiStatusCheckerService.roundsCountHistogram.labels().observe(count);
  }

  resultsCountHistogram(count: number) {
    ApiStatusCheckerService.resultsCountHistogram.labels().observe(count);
  }

  tokensCountHistogram(count: number) {
    ApiStatusCheckerService.tokensCountHistogram.labels().observe(count);
  }

  transactionsCountHistogram(count: number) {
    ApiStatusCheckerService.transactionsCountHistogram.labels().observe(count);
  }

  transfersCountHistogram(count: number) {
    ApiStatusCheckerService.transferCountHistogram.labels().observe(count);
  }

  shard_metachain_RoundsHistogram(round: number) {
    ApiStatusCheckerService.shard_metachain_RoundsHistogram.labels().observe(round);
  }

  shard_0_RoundsHistogram(round: number) {
    ApiStatusCheckerService.shard_0_RoundsHistogram.labels().observe(round);
  }

  shard_1_RoundsHistogram(round: number) {
    ApiStatusCheckerService.shard_1_RoundsHistogram.labels().observe(round);
  }

  shard_2_RoundsHistogram(round: number) {
    ApiStatusCheckerService.shard_2_RoundsHistogram.labels().observe(round);
  }

  async getCurrentRound(shardId: number): Promise<number> {
    const rounds = await this.gatewayService.get(`network/status/${shardId}`, GatewayComponentRequest.networkStatus);
    return rounds.status.erd_current_round;
  }

  async checkAllShardsRounds(): Promise<boolean> {
    const rounds = await this.getCurrentRounds();
    return Math.min(...rounds) === Math.max(...rounds);
  }

  private async getCurrentRounds(): Promise<number[]> {
    const shardIds = await this.protocolService.getShardIds();
    return await Promise.all(
      shardIds.map(shardId => this.getCurrentRound(shardId))
    );
  }
}
