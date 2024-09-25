import { Args, Float, Query, Resolver } from "@nestjs/graphql";
import { ApiConfigService } from "src/common/api-config/api.config.service";
import { QueryPagination } from "src/common/entities/query.pagination";
import { Transaction } from "src/endpoints/transactions/entities/transaction";
import { TransactionFilter } from "src/endpoints/transactions/entities/transaction.filter";
import { TransactionQueryOptions } from "src/endpoints/transactions/entities/transactions.query.options";
import { TransferService } from "src/endpoints/transfers/transfer.service";
import { GetTransfersCountInput, GetTransfersInput } from "./transfers.input";

@Resolver()
export class TransferQuery {
  constructor(
    protected readonly apiConfigService: ApiConfigService,
    protected readonly transferService: TransferService,
  ) { }

  @Query(() => [Transaction], { name: "transfers", description: "Retrieve all transfers for the given input." })
  public async getTransfers(@Args("input", { description: "Input to retreive the given transfers for." }) input: GetTransfersInput): Promise<Transaction[]> {
    const options = TransactionQueryOptions.applyDefaultOptions(input.size, { withScamInfo: input.withScamInfo, withUsername: input.withUsername });

    return await this.transferService.getTransfers(
      new TransactionFilter({
        sender: input.sender,
        token: input.token,
        senderShard: input.senderShard,
        receiverShard: input.receiverShard,
        miniBlockHash: input.miniBlockHash,
        hashes: input.hashes,
        status: input.status,
        before: input.before,
        after: input.after,
      }),
      new QueryPagination({ from: input.from, size: input.size }),
      options,
    );
  }

  @Query(() => Float, { name: "transfersCount", description: "Retrieve all transfers count for the given input." })
  public async getTransfersCount(@Args("input", { description: "Input to retrieve the given transfers count for." }) input: GetTransfersCountInput): Promise<number> {
    return await this.transferService.getTransfersCount(GetTransfersCountInput.resolve(input));
  }
}
