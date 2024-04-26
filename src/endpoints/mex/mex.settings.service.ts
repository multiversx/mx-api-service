import { Constants } from "@multiversx/sdk-nestjs-common";
import { CacheService } from "@multiversx/sdk-nestjs-cache";
import { Injectable } from "@nestjs/common";
import { gql } from "graphql-request";
import { CacheInfo } from "src/utils/cache.info";
import { GraphQlService } from "src/common/graphql/graphql.service";
import { TransactionMetadata } from "../transactions/transaction-action/entities/transaction.metadata";
import { TransactionMetadataTransfer } from "../transactions/transaction-action/entities/transaction.metadata.transfer";
import { MexSettings } from "./entities/mex.settings";
import { ApiConfigService } from "src/common/api-config/api.config.service";

@Injectable()
export class MexSettingsService {
  private wegldId: string | undefined;

  constructor(
    private readonly cachingService: CacheService,
    private readonly graphQlService: GraphQlService,
    private readonly apiConfigService: ApiConfigService,
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

  async refreshSettings(): Promise<void> {
    const settings = await this.getSettingsRaw();
    await this.cachingService.setRemote(CacheInfo.MexSettings.key, settings, CacheInfo.MexSettings.ttl);
    await this.cachingService.setLocal(CacheInfo.MexSettings.key, settings, Constants.oneMinute() * 10);

    const contracts = await this.getMexContractsRaw();
    await this.cachingService.setRemote(CacheInfo.MexContracts.key, contracts, CacheInfo.MexContracts.ttl);
    await this.cachingService.setLocal(CacheInfo.MexContracts.key, contracts, Constants.oneMinute() * 10);
  }

  async getSettings(): Promise<MexSettings | null> {
    if (!this.apiConfigService.isExchangeEnabled()) {
      return null;
    }

    const settings = await this.cachingService.getOrSet(
      CacheInfo.MexSettings.key,
      async () => await this.getSettingsRaw(),
      CacheInfo.MexSettings.ttl,
      Constants.oneMinute() * 10,
    );

    this.wegldId = settings?.wegldId;

    return settings;
  }

  async getMexContracts(): Promise<Set<string>> {
    let contracts = await this.cachingService.getLocal<Set<string>>(CacheInfo.MexContracts.key);
    if (!contracts) {
      contracts = await this.getMexContractsRaw();
      await this.cachingService.setLocal(CacheInfo.MexContracts.key, contracts, Constants.oneMinute() * 10);
    }

    return contracts;
  }

  async getMexContractsRaw(): Promise<Set<string>> {
    const settings = await this.getSettings();
    if (!settings) {
      return new Set<string>();
    }

    return new Set<string>([
      settings.distributionContract,
      settings.lockedAssetContract,
      settings.routerFactoryContract,
      ...settings.farmContracts,
      ...settings.pairContracts,
      ...settings.wrapContracts,
    ]);
  }

  public async getSettingsRaw(): Promise<MexSettings | null> {
    const variables = {
      offset: 0,
      limit: 500,
    };

    const query = gql`
    query ($offset: Int, $limit: Int) {
      pairs(offset: $offset, limit: $limit) {
        state
        address
        firstToken {
          name
          identifier
          decimals
          __typename
        }
        secondToken {
          name
          identifier
          decimals
          __typename
        } 
      }
      proxy {
        address
        lockedAssetTokens {
          collection
          __typename
        }
      }
      farms {
        ... on FarmModelV1_2 {
          state
          address
        }
        ... on FarmModelV1_3 {
          state
          address
        }
        ... on FarmModelV2 {
          state
          address
        }
     }
      wrappingInfo {
        address
        shard
      }
      distribution {
        address
      }
      lockedAssetFactory {
        address
      }
      stakingFarms {
        state
        address
      }
      stakingProxies {
        address
      }
      factory {
        address
      }
    }
    `;

    const response = await this.graphQlService.getExchangeServiceData(query, variables);
    if (!response) {
      return null;
    }

    const settings = MexSettings.fromQueryResponse(response);
    return settings;
  }

  getWegldId(): string | undefined {
    return this.wegldId;
  }
}
