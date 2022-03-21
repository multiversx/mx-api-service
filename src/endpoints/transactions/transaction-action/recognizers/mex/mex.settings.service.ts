import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { CachingService } from "src/common/caching/caching.service";
import { ApiService } from "src/common/network/api.service";
import { Constants } from "src/utils/constants";
import { TransactionMetadata } from "../../entities/transaction.metadata";
import { TransactionMetadataTransfer } from "../../entities/transaction.metadata.transfer";
import { MexSettings } from "./entities/mex.settings";

@Injectable()
export class MexSettingsService {
  constructor(
    private readonly cachingService: CachingService,
    private readonly configService: ConfigService,
    private readonly apiService: ApiService
  ) { }

  getTransfers(metadata: TransactionMetadata): TransactionMetadataTransfer[] | undefined {
    const transfers = metadata.transfers;
    if (!transfers || transfers.length === 0) {
      return undefined;
    }

    return transfers;
  }

  async isMexInteraction(metadata: TransactionMetadata): Promise<boolean> {
    const mexContracts = await this.getMexContracts();
    return mexContracts.has(metadata.receiver);
  }

  private settings: MexSettings | null | undefined;

  async getSettings(): Promise<MexSettings | null> {
    let settings = this.settings;
    if (settings === undefined) {
      settings = await this.cachingService.getOrSetCache(
        'mex:settings:v3',
        async () => await this.getSettingsRaw(),
        Constants.oneDay()
      );

      this.settings = settings;
    }

    return settings;
  }

  private mexContracts?: Set<string>;

  async getMexContracts(): Promise<Set<string>> {
    let mexContracts = this.mexContracts;
    if (!mexContracts) {
      const settings = await this.getSettings();
      if (!settings) {
        return new Set<string>();
      }

      mexContracts = new Set<string>([
        settings.distributionContract,
        settings.lockedAssetContract,
        ...settings.farmContracts,
        ...settings.pairContracts,
        ...settings.wrapContracts,
      ]);

      this.mexContracts = mexContracts;
    }

    return mexContracts;
  }

  private async getSettingsRaw(): Promise<MexSettings | null> {
    const params = {
      "variables": {
        "offset": 0,
        "limit": 500,
      },
      "query": "query ($offset: Int, $limit: Int) {\r\n  pairs(offset: $offset, limit: $limit) {\r\n    address\r\n    firstToken {\r\n      name\r\n      identifier\r\n      decimals\r\n      __typename\r\n    }\r\n    secondToken {\r\n      name\r\n      identifier\r\n      decimals\r\n      __typename\r\n    } }\r\n  proxy {\r\n    address\r\n  }\r\n  farms {\r\n    address\r\n  }\r\n  wrappingInfo {\r\n    address\r\n    shard\r\n  }\r\n  distribution {\r\n    address\r\n  }\r\n  lockedAssetFactory {\r\n    address\r\n  }\r\n  stakingFarms {\r\n    address\r\n  }\r\n  stakingProxies {\r\n    address\r\n  }\r\n}\r\n",
    };

    const result = await this.apiCall(params);
    if (!result) {
      return null;
    }

    const settings = new MexSettings();
    settings.farmContracts = [
      ...result.farms.map((x: any) => x.address),
      ...result.stakingFarms.map((x: any) => x.address),
      ...result.stakingProxies.map((x: any) => x.address),
      result.proxy.address,
    ];
    settings.pairContracts = [
      ...result.pairs.map((x: any) => x.address),
      result.proxy.address,
    ];
    settings.wrapContracts = result.wrappingInfo.map((x: any) => x.address);
    settings.distributionContract = result.distribution.address;
    settings.lockedAssetContract = result.lockedAssetFactory.address;

    const mexEgldPairs = result.pairs.filter((x: any) => x.firstToken.name === 'WrappedEGLD' && x.secondToken.name === 'MEX');
    if (mexEgldPairs.length > 0) {
      settings.wegldId = mexEgldPairs[0].firstToken.identifier;
      settings.mexId = mexEgldPairs[0].secondToken.identifier;
    }

    return settings;
  }

  getMicroServiceUrlMandatory(): string {
    const microServiceUrl = this.getMicroServiceUrl();
    if (!microServiceUrl) {
      throw new Error('No transaction-action.mex.microServiceUrl present');
    }

    return microServiceUrl;
  }

  getWegldId(): string | undefined {
    return this.settings?.wegldId;
  }

  getMicroServiceUrl(): string | undefined {
    return this.configService.get<string>('transaction-action.mex.microServiceUrl') ?? this.configService.get<string>('plugins.transaction-action.mex.microServiceUrl');
  }

  private async apiCall(params: any): Promise<any> {
    const microServiceUrl = this.getMicroServiceUrlMandatory();

    const result = await this.apiService.post(microServiceUrl, params);

    return result.data.data;
  }
}
