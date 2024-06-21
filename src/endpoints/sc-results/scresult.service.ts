import { ApiUtils } from "@multiversx/sdk-nestjs-http";
import { forwardRef, Inject, Injectable } from "@nestjs/common";
import { AssetsService } from "src/common/assets/assets.service";
import { QueryPagination } from "src/common/entities/query.pagination";
import { IndexerService } from "src/common/indexer/indexer.service";
import { Transaction } from "../transactions/entities/transaction";
import { TransactionType } from "../transactions/entities/transaction.type";
import { TransactionActionService } from "../transactions/transaction-action/transaction.action.service";
import { SmartContractResult } from "./entities/smart.contract.result";
import { SmartContractResultFilter } from "./entities/smart.contract.result.filter";
import { OriginLogger } from "@multiversx/sdk-nestjs-common";
import { SmartContractResultOptions } from "./entities/smart.contract.result.options";

@Injectable()
export class SmartContractResultService {
  private readonly logger = new OriginLogger(SmartContractResultService.name);

  constructor(
    private readonly indexerService: IndexerService,
    @Inject(forwardRef(() => TransactionActionService))
    private readonly transactionActionService: TransactionActionService,
    private readonly assetsService: AssetsService,
  ) { }

  async getScResults(pagination: QueryPagination, filter: SmartContractResultFilter, options: SmartContractResultOptions): Promise<SmartContractResult[]> {
    const elasticResult = await this.indexerService.getScResults(pagination, filter);

    const smartContractResults = elasticResult.map(scResult => ApiUtils.mergeObjects(new SmartContractResult(), scResult));

    const accountAssets = await this.assetsService.getAllAccountAssets();
    for (const smartContractResult of smartContractResults) {
      const transaction = ApiUtils.mergeObjects(new Transaction(), smartContractResult);
      transaction.type = TransactionType.SmartContractResult;

      try {
        smartContractResult.action = await this.transactionActionService.getTransactionAction(transaction, options.withActionTransferValue);
      } catch (error) {
        this.logger.error(`Failed to get transaction action for smart contract result with hash '${smartContractResult.hash}'`);
        this.logger.error(error);
      }

      smartContractResult.senderAssets = accountAssets[smartContractResult.sender];
      smartContractResult.receiverAssets = accountAssets[smartContractResult.receiver];
    }

    return smartContractResults;
  }

  async getScResult(scHash: string): Promise<SmartContractResult | undefined> {
    const scResult = await this.indexerService.getScResult(scHash);
    if (!scResult) {
      return undefined;
    }

    const smartContractResult = ApiUtils.mergeObjects(new SmartContractResult(), scResult);
    const transaction = ApiUtils.mergeObjects(new Transaction(), smartContractResult);
    transaction.type = TransactionType.SmartContractResult;

    try {
      smartContractResult.action = await this.transactionActionService.getTransactionAction(transaction);
    } catch (error) {
      this.logger.error(`Failed to get transaction action for smart contract result with hash '${smartContractResult.hash}'`);
      this.logger.error(error);
    }

    return smartContractResult;
  }

  async getScResultsCount(filter: SmartContractResultFilter): Promise<number> {
    return await this.indexerService.getScResultsCount(filter);
  }

  async getAccountScResults(address: string, pagination: QueryPagination): Promise<SmartContractResult[]> {
    const elasticResult = await this.indexerService.getAccountScResults(address, pagination);

    const smartContractResults = elasticResult.map(scResult => ApiUtils.mergeObjects(new SmartContractResult(), scResult));

    for (const smartContractResult of smartContractResults) {
      const transaction = ApiUtils.mergeObjects(new Transaction(), smartContractResult);
      transaction.type = TransactionType.SmartContractResult;

      try {
        smartContractResult.action = await this.transactionActionService.getTransactionAction(transaction);
      } catch (error) {
        this.logger.error(`Failed to get transaction action for smart contract result with hash '${smartContractResult.hash}'`);
        this.logger.error(error);
      }
    }

    return smartContractResults;
  }

  async getAccountScResultsCount(address: string): Promise<number> {
    return await this.indexerService.getAccountScResultsCount(address);
  }
}
