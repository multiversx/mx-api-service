import { Resolver } from "@nestjs/graphql";
import { ApiConfigService } from "src/common/api-config/api.config.service";
import { Transaction } from "src/endpoints/transactions/entities/transaction";
import { TransferService } from "src/endpoints/transfers/transfer.service";
import { TransferQuery } from "./transfers.query";

@Resolver(() => Transaction)
export class TransferResolver extends TransferQuery {
  constructor(
    apiConfigService: ApiConfigService,
    transferService: TransferService
  ) {
    super(apiConfigService, transferService);
  }
}
