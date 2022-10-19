import { Resolver } from "@nestjs/graphql";
import { Transaction } from "src/endpoints/transactions/entities/transaction";
import { TransferService } from "src/endpoints/transfers/transfer.service";
import { TransferQuery } from "./transfers.query";

@Resolver(() => Transaction)
export class TransferResolver extends TransferQuery {
  constructor(transferService: TransferService) {
    super(transferService);
  }
}
