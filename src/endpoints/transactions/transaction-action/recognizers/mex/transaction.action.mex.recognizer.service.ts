import { Injectable } from "@nestjs/common";
import { TransactionAction } from "../../entities/transaction.action";
import { TransactionMetadata } from "../../entities/transaction.metadata";
import { TransactionActionRecognizerInterface } from "../../transaction.action.recognizer.interface";
import { MexFarmActionRecognizerService } from "./mex.farm.action.recognizer.service";
import { MexPairActionRecognizerService } from "./mex.pair.action.recognizer.service";
import { MexWrapActionRecognizerService } from "./mex.wrap.action.recognizer.service";
import { MexDistributionActionRecognizerService } from "./mex.distribution.action.recognizer.service";
import { MexLockedAssetActionRecognizerService } from "./mex.locked.asset.action.recognizer.service";
import { MexSettingsService } from "../../../../mex/mex.settings.service";
import { ApiConfigService } from "src/common/api-config/api.config.service";
import { MetabondingActionRecognizerService } from "./mex.metabonding.action.recognizer.service";

@Injectable()
export class TransactionActionMexRecognizerService implements TransactionActionRecognizerInterface {
  constructor(
    private readonly pairActionRecognizer: MexPairActionRecognizerService,
    private readonly farmActionRecognizer: MexFarmActionRecognizerService,
    private readonly wrapActionRecognizer: MexWrapActionRecognizerService,
    private readonly distributionRecognizer: MexDistributionActionRecognizerService,
    private readonly lockedAssetRecognizer: MexLockedAssetActionRecognizerService,
    private readonly metabondingRecognizer: MetabondingActionRecognizerService,
    private readonly mexSettingsService: MexSettingsService,
    private readonly apiConfigService: ApiConfigService
  ) { }

  async isActive(): Promise<boolean> {
    const microServiceUrl = this.apiConfigService.getMaiarExchangeUrl();
    if (!microServiceUrl) {
      return false;
    }

    const settings = await this.mexSettingsService.getSettings();
    return settings !== undefined;
  }

  async recognize(metadata: TransactionMetadata): Promise<TransactionAction | undefined> {
    const settings = await this.mexSettingsService.getSettings();
    if (!settings) {
      return undefined;
    }

    const isMexInteraction = await this.mexSettingsService.isMexInteraction(metadata);
    if (!isMexInteraction && metadata.receiver !== this.apiConfigService.getMetabondingContractAddress()) {
      return undefined;
    }

    return this.distributionRecognizer.recognize(settings, metadata) ??
      (await this.pairActionRecognizer.recognize(settings, metadata)) ??
      this.farmActionRecognizer.recognize(settings, metadata) ??
      this.wrapActionRecognizer.recognize(settings, metadata) ??
      this.lockedAssetRecognizer.recognize(settings, metadata) ??
      this.metabondingRecognizer.recognize(metadata);
  }
}
