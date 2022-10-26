import { Resolver } from "@nestjs/graphql";
import { SettingsService } from "src/common/settings/settings.service";
import { Transaction } from "src/endpoints/transactions/entities/transaction";
import { TransferService } from "src/endpoints/transfers/transfer.service";
import { TransferQuery } from "./transfers.query";

@Resolver(() => Transaction)
export class TransferResolver extends TransferQuery {
  constructor(
    transferService: TransferService,
    settingsService: SettingsService,
  ) {
    super(transferService, settingsService);
  }
}
