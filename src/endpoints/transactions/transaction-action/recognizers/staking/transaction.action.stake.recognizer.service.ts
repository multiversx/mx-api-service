import { BinaryUtils, Constants, NumberUtils, CachingService } from "@elrondnetwork/erdnest";
import { forwardRef, Inject, Injectable } from "@nestjs/common";
import { IdentitiesService } from "src/endpoints/identities/identities.service";
import { ProviderService } from "src/endpoints/providers/provider.service";
import { TransactionAction } from "../../entities/transaction.action";
import { TransactionActionCategory } from "../../entities/transaction.action.category";
import { TransactionMetadata } from "../../entities/transaction.metadata";
import { TransactionActionRecognizerInterface } from "../../transaction.action.recognizer.interface";
import { StakeFunction } from "./entities/stake.function";

@Injectable()
export class StakeActionRecognizerService implements TransactionActionRecognizerInterface {
  constructor(
    @Inject(forwardRef(() => ProviderService))
    private readonly providerService: ProviderService,
    @Inject(forwardRef(() => IdentitiesService))
    private readonly identitiesService: IdentitiesService,
    private readonly cachingService: CachingService,
  ) { }

  private async getProviders(): Promise<{ [key: string]: { providerName: string, providerAvatar: string } }> {
    let providersDetails = await this.cachingService.getCacheLocal<{ [key: string]: { providerName: string, providerAvatar: string } }>('plugins:staking:providerAddresses');
    if (!providersDetails) {
      const providers = await this.providerService.getAllProviders();
      const identities = await this.identitiesService.getAllIdentities();

      providersDetails = {};
      for (const provider of providers) {
        let providerName = provider.identity ?? provider.provider;
        let providerAvatar = '';

        const matchingIdentities = identities.filter(x => x.identity === provider.identity);
        if (matchingIdentities.length > 0) {
          const name = matchingIdentities[0].name;
          if (name && name.length !== 192) {
            providerName = name;
          }

          const avatar = matchingIdentities[0].avatar;
          if (avatar) {
            providerAvatar = avatar;
          }
        }

        providersDetails[provider.provider] = { providerName, providerAvatar };
      }

      await this.cachingService.setCacheLocal('plugins:staking:providerAddresses', providersDetails, Constants.oneHour());
    }

    return providersDetails;
  }

  async recognize(metadata: TransactionMetadata): Promise<TransactionAction | undefined> {
    const providers = await this.getProviders();

    const providerDetails = providers[metadata.receiver];
    if (!providerDetails) {
      return undefined;
    }

    switch (metadata.functionName) {
      case StakeFunction.delegate:
      case StakeFunction.stake:
        return this.getDelegateAction(metadata, providerDetails);
      case StakeFunction.unDelegate:
        return this.getUnDelegateAction(metadata, providerDetails);
      case StakeFunction.claimRewards:
        return this.getAction(metadata, providerDetails, "Claim rewards");
      case StakeFunction.reDelegateRewards:
        return this.getAction(metadata, providerDetails, "Redelegate rewards");
      case StakeFunction.withdraw:
        return this.getAction(metadata, providerDetails, "Withdraw");
      default:
        return undefined;
    }
  }

  private getDelegateAction(metadata: TransactionMetadata, providerDetails: { providerName: string, providerAvatar: string }): TransactionAction | undefined {
    const value = metadata.value;
    const valueDenominated = NumberUtils.toDenominatedString(value, 18);

    const result = new TransactionAction();
    result.category = TransactionActionCategory.stake;
    result.name = StakeFunction.delegate;
    result.description = `Delegate ${valueDenominated} eGLD to staking provider ${providerDetails.providerName}`;
    result.arguments = {
      value: value.toString(),
      ...providerDetails,
    };

    return result;
  }

  private getUnDelegateAction(metadata: TransactionMetadata, providerDetails: { providerName: string, providerAvatar: string }): TransactionAction | undefined {
    const value = BinaryUtils.hexToBigInt(metadata.functionArgs[0]);
    const valueDenominated = NumberUtils.toDenominatedString(value, 18);

    const result = new TransactionAction();
    result.category = TransactionActionCategory.stake;
    result.name = StakeFunction.unDelegate;
    result.description = `Undelegate ${valueDenominated} eGLD from staking provider ${providerDetails.providerName}`;
    result.arguments = {
      value: value.toString(),
      ...providerDetails,
    };

    return result;
  }

  private getAction(metadata: TransactionMetadata, providerDetails: { providerName: string, providerAvatar: string }, action: string): TransactionAction | undefined {
    const result = new TransactionAction();
    result.category = TransactionActionCategory.stake;
    result.name = metadata.functionName ?? '';
    result.description = `${action} from staking provider ${providerDetails.providerName}`;
    result.arguments = {
      ...providerDetails,
    };

    return result;
  }
}
