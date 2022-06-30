import { Constants, CachingService } from "@elrondnetwork/erdnest";
import { Injectable } from "@nestjs/common";
import { gql } from "graphql-request";
import { CacheInfo } from "src/utils/cache.info";
import { GraphQlService } from "src/common/graphql/graphql.service";
import { TransactionMetadata } from "../transactions/transaction-action/entities/transaction.metadata";
import { TransactionMetadataTransfer } from "../transactions/transaction-action/entities/transaction.metadata.transfer";
import { MexSettings } from "./entities/mex.settings";

@Injectable()
export class MexSettingsService {
  private wegldId: string | undefined;

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

  async refreshSettings(): Promise<void> {
    const settings = await this.getSettingsRaw();
    await this.cachingService.setCacheRemote(CacheInfo.MexSettings.key, settings, CacheInfo.MexSettings.ttl);
    await this.cachingService.setCacheLocal(CacheInfo.MexSettings.key, settings, Constants.oneMinute() * 10);

    const contracts = await this.getMexContractsRaw();
    await this.cachingService.setCacheRemote(CacheInfo.MexContracts.key, contracts, CacheInfo.MexContracts.ttl);
    await this.cachingService.setCacheLocal(CacheInfo.MexContracts.key, contracts, Constants.oneMinute() * 10);
  }

  async getSettings(): Promise<MexSettings | null> {
    const settings = await this.cachingService.getOrSetCache(
      CacheInfo.MexSettings.key,
      async () => await this.getSettingsRaw(),
      CacheInfo.MexSettings.ttl,
      Constants.oneMinute() * 10,
    );

    this.wegldId = settings?.wegldId;

    return settings;
  }

  async getMexContracts(): Promise<Set<string>> {
    let contracts = await this.cachingService.getCacheLocal<Set<string>>(CacheInfo.MexContracts.key);
    if (!contracts) {
      contracts = await this.getMexContractsRaw();
      await this.cachingService.setCacheLocal(CacheInfo.MexContracts.key, contracts, Constants.oneMinute() * 10);
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
    return this.wegldId;
  }
}
