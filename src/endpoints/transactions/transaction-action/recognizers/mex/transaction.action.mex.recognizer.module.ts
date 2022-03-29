import { forwardRef, Module } from "@nestjs/common";
import { TokenModule } from "src/endpoints/tokens/token.module";
import { MexFarmActionRecognizerService } from "./mex.farm.action.recognizer.service";
import { MexPairActionRecognizerService } from "./mex.pair.action.recognizer.service";
import { TransactionActionMexRecognizerService } from "./transaction.action.mex.recognizer.service";
import { MexWrapActionRecognizerService } from "./mex.wrap.action.recognizer.service";
import { MexDistributionActionRecognizerService } from "./mex.distribution.action.recognizer.service";
import { TransactionActionModule } from "../../transaction.action.module";
import { MexLockedAssetActionRecognizerService } from "./mex.locked.asset.action.recognizer.service";
import { MexSettingsModule } from "./mex.settings.module";

@Module({
  imports: [
    forwardRef(() => TokenModule),
    forwardRef(() => TransactionActionModule),
    MexSettingsModule,
  ],
  providers: [
    TransactionActionMexRecognizerService,
    MexPairActionRecognizerService,
    MexFarmActionRecognizerService,
    MexWrapActionRecognizerService,
    MexDistributionActionRecognizerService,
    MexLockedAssetActionRecognizerService,
  ],
  exports: [TransactionActionMexRecognizerService],
})
export class TransactionActionMexRecognizerModule { }
