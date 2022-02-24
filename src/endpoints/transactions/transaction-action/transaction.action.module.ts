import { forwardRef, Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { TokenModule } from "src/endpoints/tokens/token.module";
import { TransactionActionEsdtNftRecognizerService } from "./recognizers/esdt/transaction.action.esdt.nft.recognizer.service";
import { TransactionActionService } from "./transaction.action.service";
import { TransactionActionMexRecognizerModule } from "./recognizers/mex/transaction.action.mex.recognizer.module";
import { StakeActionRecognizerService } from "./recognizers/staking/transaction.action.stake.recognizer.service";
import { SCCallActionRecognizerService } from "./recognizers/sc-calls/transaction.action.sc-calls.recognizer.service";
import { ProviderModule } from "src/endpoints/providers/provider.module";
import { IdentitiesModule } from "src/endpoints/identities/identities.module";

@Module({
  imports: [
    forwardRef(() => TokenModule),
    ConfigModule,
    TransactionActionMexRecognizerModule,
    forwardRef(() => ProviderModule),
    forwardRef(() => IdentitiesModule),
  ],
  providers: [
    TransactionActionService,
    TransactionActionEsdtNftRecognizerService,
    StakeActionRecognizerService,
    SCCallActionRecognizerService,
  ],
  exports: [TransactionActionService],
})
export class TransactionActionModule { }
