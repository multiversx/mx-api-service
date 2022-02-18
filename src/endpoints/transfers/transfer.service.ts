import { Injectable, Logger } from "@nestjs/common";
import { ApiConfigService } from "src/common/api-config/api.config.service";
import { ElasticService } from "src/common/elastic/elastic.service";
import { AbstractQuery } from "src/common/elastic/entities/abstract.query";
import { ElasticQuery } from "src/common/elastic/entities/elastic.query";
import { ElasticSortOrder } from "src/common/elastic/entities/elastic.sort.order";
import { ElasticSortProperty } from "src/common/elastic/entities/elastic.sort.property";
import { QueryConditionOptions } from "src/common/elastic/entities/query.condition.options";
import { QueryOperator } from "src/common/elastic/entities/query.operator";
import { QueryType } from "src/common/elastic/entities/query.type";
import { QueryPagination } from "src/common/entities/query.pagination";
import { SortOrder } from "src/common/entities/sort.order";
import { PluginService } from "src/common/plugins/plugin.service";
import { ApiUtils } from "src/utils/api.utils";
import { TransactionFilter } from "../transactions/entities/transaction.filter";
import { Transfer } from "./entities/transfer";
import { TransferType } from "./entities/transfer.type";

@Injectable()
export class TransferService {
  private readonly logger: Logger;
  constructor(
    private readonly apiConfigService: ApiConfigService,
    private readonly elasticService: ElasticService,
    private readonly pluginsService: PluginService,
  ) {
    this.logger = new Logger(TransferService.name);
  }

  private buildTransferFilterQuery(filter: TransactionFilter, address?: string): ElasticQuery {
    const queries: AbstractQuery[] = [];
    const shouldQueries: AbstractQuery[] = [];
    const mustQueries: AbstractQuery[] = [];

    if (address) {
      shouldQueries.push(QueryType.Match('sender', address));
      shouldQueries.push(QueryType.Match('receiver', address));

      if (this.apiConfigService.getIsIndexerV3FlagActive()) {
        shouldQueries.push(QueryType.Match('receivers', address));
      }
    }

    if (filter.sender) {
      queries.push(QueryType.Match('sender', filter.sender));
    }

    if (filter.receiver) {
      shouldQueries.push(QueryType.Match('receiver', filter.receiver));

      if (this.apiConfigService.getIsIndexerV3FlagActive()) {
        shouldQueries.push(QueryType.Match('receivers', filter.receiver));
      }
    }

    if (filter.token) {
      queries.push(QueryType.Match('tokens', filter.token, QueryOperator.AND));
    }

    if (this.apiConfigService.getIsIndexerV3FlagActive()) {
      if (filter.function) {
        queries.push(QueryType.Match('function', filter.function));
      }
    }

    if (filter.senderShard !== undefined) {
      queries.push(QueryType.Match('senderShard', filter.senderShard));
    }

    if (filter.receiverShard !== undefined) {
      queries.push(QueryType.Match('receiverShard', filter.receiverShard));
    }

    if (filter.miniBlockHash) {
      queries.push(QueryType.Match('miniBlockHash', filter.miniBlockHash));
    }

    if (filter.hashes) {
      queries.push(QueryType.Should(filter.hashes.map(hash => QueryType.Match('_id', hash))));
    }

    if (filter.status) {
      queries.push(QueryType.Match('status', filter.status));
    }

    if (filter.search) {
      queries.push(QueryType.Wildcard('data', `*${filter.search}*`));
    }

    let elasticQuery = ElasticQuery.create()
      .withCondition(QueryConditionOptions.should, shouldQueries)
      .withCondition(QueryConditionOptions.must, mustQueries);


    if (filter.before || filter.after) {
      elasticQuery = elasticQuery
        .withFilter([QueryType.Range('timestamp', filter.before ?? Date.now(), filter.after ?? 0)]);
    }

    return elasticQuery;
  }


  async getTransfers(filter: TransactionFilter, pagination: QueryPagination, address?: string): Promise<Transfer[]> {
    const sortOrder: ElasticSortOrder = !filter.order || filter.order === SortOrder.desc ? ElasticSortOrder.descending : ElasticSortOrder.ascending;

    const timestamp: ElasticSortProperty = { name: 'timestamp', order: sortOrder };
    const nonce: ElasticSortProperty = { name: 'nonce', order: sortOrder };

    const elasticQuery = this.buildTransferFilterQuery(filter, address)
      .withPagination({ from: pagination.from, size: pagination.size })
      .withSort([timestamp, nonce]);

    const elasticTransfers = await this.elasticService.getList('operations', 'txHash', elasticQuery);

    const transfers: Transfer[] = [];

    for (const elasticTransfer of elasticTransfers) {
      const transfer = ApiUtils.mergeObjects(new Transfer(), elasticTransfer);
      if (elasticTransfer.type === 'unsigned') {
        transfer.type = TransferType.SmartContractResult;
      } else {
        transfer.type = TransferType.Transaction;
      }

      await this.processTransfer(transfer);

      transfers.push(transfer);
    }

    return transfers;
  }

  async getTransfersCount(filter: TransactionFilter, address?: string): Promise<number> {
    const elasticQuery = this.buildTransferFilterQuery(filter, address);

    return await this.elasticService.getCount('operations', elasticQuery);
  }

  private async processTransfer(transfer: Transfer): Promise<void> {
    try {
      await this.pluginsService.processTransaction(transfer);
    } catch (error) {
      this.logger.error(`Unhandled error when processing plugin for transfer with hash '${transfer.txHash}'`);
      this.logger.error(error);
    }
  }
}
