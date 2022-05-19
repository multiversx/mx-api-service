import { Injectable } from "@nestjs/common";
import { gql } from "graphql-request";
import { CachingService } from "src/common/caching/caching.service";
import { CacheInfo } from "src/common/caching/entities/cache.info";
import { GraphQlService } from "src/common/graphql/graphql.service";
import { Constants } from "src/utils/constants";
import { TransactionMetadata } from "../transactions/transaction-action/entities/transaction.metadata";
import { TransactionMetadataTransfer } from "../transactions/transaction-action/entities/transaction.metadata.transfer";
import { MexSettings } from "./entities/mex.settings";

@Injectable()
export class MexSettingsService {
  constructor(
    private readonly cachingService: CachingService,
    private readonly graphQlService: GraphQlService,
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
        CacheInfo.MexSettings.key,
        async () => await this.getSettingsRaw(),
        CacheInfo.MexSettings.ttl,
        Constants.oneMinute() * 10,
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
        lockedAssetToken {
          collection
          __typename
        }
      }
      farms {
        state
        address
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
    }
    `;

    const result = await this.graphQlService.getData(query, variables);
    if (!result) {
      return null;
    }

    const settings = new MexSettings();
    settings.farmContracts = [
      ...result.farms.filter((x: any) => ['Active', 'Migrate'].includes(x.state)).map((x: any) => x.address),
      ...result.stakingFarms.filter((x: any) => x.state === 'Active').map((x: any) => x.address),
      ...result.stakingProxies.map((x: any) => x.address),
      result.proxy.address,
    ];
    settings.pairContracts = [
      ...result.pairs.filter((x: any) => x.state === 'Active').map((x: any) => x.address),
      result.proxy.address,
    ];
    settings.wrapContracts = result.wrappingInfo.map((x: any) => x.address);
    settings.distributionContract = result.distribution.address;
    settings.lockedAssetContract = result.lockedAssetFactory.address;
    settings.lockedAssetIdentifier = result.proxy.lockedAssetToken.collection;

    const mexEgldPairs = result.pairs.filter((x: any) => x.firstToken.name === 'WrappedEGLD' && x.secondToken.name === 'MEX');
    if (mexEgldPairs.length > 0) {
      settings.wegldId = mexEgldPairs[0].firstToken.identifier;
      settings.mexId = mexEgldPairs[0].secondToken.identifier;
    }

    return settings;
  }

  getWegldId(): string | undefined {
    return this.settings?.wegldId;
  }
}
