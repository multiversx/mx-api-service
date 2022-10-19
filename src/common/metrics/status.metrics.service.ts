import { forwardRef, Inject, Injectable } from "@nestjs/common";
import { Histogram } from "prom-client";
import { GatewayComponentRequest } from "../gateway/entities/gateway.component.request";
import { GatewayService } from "../gateway/gateway.service";
import { ProtocolService } from "../protocol/protocol.service";

@Injectable()
export class StatusMetricsService {
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
    if (!StatusMetricsService.accountsCountHistogram) {
      StatusMetricsService.accountsCountHistogram = new Histogram({
        name: 'total_accounts',
        help: 'total_accounts',
        labelNames: [],
        buckets: [],
      });
    }

    if (!StatusMetricsService.blocksCountHistogram) {
      StatusMetricsService.blocksCountHistogram = new Histogram({
        name: 'total_blocks',
        help: 'total_blocks',
        labelNames: [],
        buckets: [],
      });
    }

    if (!StatusMetricsService.collectionsCountHistogram) {
      StatusMetricsService.collectionsCountHistogram = new Histogram({
        name: 'total_collections',
        help: 'total_collections',
        labelNames: [],
        buckets: [],
      });
    }

    if (!StatusMetricsService.nftsCountHistogram) {
      StatusMetricsService.nftsCountHistogram = new Histogram({
        name: 'total_nfts',
        help: 'total_nfts',
        labelNames: [],
        buckets: [],
      });
    }

    if (!StatusMetricsService.tagsCountHistogram) {
      StatusMetricsService.tagsCountHistogram = new Histogram({
        name: 'total_tags',
        help: 'total_tags',
        labelNames: [],
        buckets: [],
      });
    }

    if (!StatusMetricsService.roundsCountHistogram) {
      StatusMetricsService.roundsCountHistogram = new Histogram({
        name: 'total_rounds',
        help: 'total_rounds',
        labelNames: [],
        buckets: [],
      });
    }

    if (!StatusMetricsService.resultsCountHistogram) {
      StatusMetricsService.resultsCountHistogram = new Histogram({
        name: 'total_scResults',
        help: 'total_scResults',
        labelNames: [],
        buckets: [],
      });
    }

    if (!StatusMetricsService.tokensCountHistogram) {
      StatusMetricsService.tokensCountHistogram = new Histogram({
        name: 'total_tokens',
        help: 'total_tokens',
        labelNames: [],
        buckets: [],
      });
    }

    if (!StatusMetricsService.transferCountHistogram) {
      StatusMetricsService.transferCountHistogram = new Histogram({
        name: 'total_transfers',
        help: 'total_transfers',
        labelNames: [],
        buckets: [],
      });
    }

    if (!StatusMetricsService.shard_0_RoundsHistogram) {
      StatusMetricsService.shard_0_RoundsHistogram = new Histogram({
        name: 'shard_0_rounds',
        help: 'shard_0_rounds',
        labelNames: [],
        buckets: [],
      });
    }

    if (!StatusMetricsService.shard_1_RoundsHistogram) {
      StatusMetricsService.shard_1_RoundsHistogram = new Histogram({
        name: 'shard_1_rounds',
        help: 'shard_1_rounds',
        labelNames: [],
        buckets: [],
      });
    }

    if (!StatusMetricsService.shard_2_RoundsHistogram) {
      StatusMetricsService.shard_2_RoundsHistogram = new Histogram({
        name: 'shard_2_rounds',
        help: 'shard_2_rounds',
        labelNames: [],
        buckets: [],
      });
    }

    if (!StatusMetricsService.shard_metachain_RoundsHistogram) {
      StatusMetricsService.shard_metachain_RoundsHistogram = new Histogram({
        name: 'shard_4294967295_rounds',
        help: 'shard_4294967295_rounds',
        labelNames: [],
        buckets: [],
      });
    }
  }

  setAccountsCount(count: number) {
    StatusMetricsService.accountsCountHistogram.labels().observe(count);
  }

  blocksCountHistogram(count: number) {
    StatusMetricsService.blocksCountHistogram.labels().observe(count);
  }

  collectionsCountHistogram(count: number) {
    StatusMetricsService.collectionsCountHistogram.labels().observe(count);
  }

  nftsCountHistogram(count: number) {
    StatusMetricsService.nftsCountHistogram.labels().observe(count);
  }

  tagsCountHistogram(count: number) {
    StatusMetricsService.tagsCountHistogram.labels().observe(count);
  }

  roundsCountHistogram(count: number) {
    StatusMetricsService.roundsCountHistogram.labels().observe(count);
  }

  resultsCountHistogram(count: number) {
    StatusMetricsService.resultsCountHistogram.labels().observe(count);
  }

  tokensCountHistogram(count: number) {
    StatusMetricsService.tokensCountHistogram.labels().observe(count);
  }

  transactionsCountHistogram(count: number) {
    StatusMetricsService.transactionsCountHistogram.labels().observe(count);
  }

  transfersCountHistogram(count: number) {
    StatusMetricsService.transferCountHistogram.labels().observe(count);
  }

  shard_metachain_RoundsHistogram(round: number) {
    StatusMetricsService.shard_metachain_RoundsHistogram.labels().observe(round);
  }

  shard_0_RoundsHistogram(round: number) {
    StatusMetricsService.shard_0_RoundsHistogram.labels().observe(round);
  }

  shard_1_RoundsHistogram(round: number) {
    StatusMetricsService.shard_1_RoundsHistogram.labels().observe(round);
  }

  shard_2_RoundsHistogram(round: number) {
    StatusMetricsService.shard_2_RoundsHistogram.labels().observe(round);
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
