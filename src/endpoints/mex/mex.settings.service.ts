import { Constants } from "@multiversx/sdk-nestjs-common";
import { CacheService } from "@multiversx/sdk-nestjs-cache";
import { Injectable } from "@nestjs/common";
import { CacheInfo } from "src/utils/cache.info";
import { GraphQlService } from "src/common/graphql/graphql.service";
import { TransactionMetadata } from "../transactions/transaction-action/entities/transaction.metadata";
import { TransactionMetadataTransfer } from "../transactions/transaction-action/entities/transaction.metadata.transfer";
import { MexSettings } from "./entities/mex.settings";
import { ApiConfigService } from "src/common/api-config/api.config.service";
import { paginatedPairsAddressesQuery, settingsBaseQuery } from "./graphql/settings.query";

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
    this.cachingService.setLocal(CacheInfo.MexSettings.key, settings, Constants.oneMinute() * 10);

    const contracts = await this.getMexContractsRaw();
    await this.cachingService.setRemote(CacheInfo.MexContracts.key, contracts, CacheInfo.MexContracts.ttl);
    this.cachingService.setLocal(CacheInfo.MexContracts.key, contracts, Constants.oneMinute() * 10);
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
    let contracts = this.cachingService.getLocal<Set<string>>(CacheInfo.MexContracts.key);
    if (!contracts) {
      contracts = await this.getMexContractsRaw();
      this.cachingService.setLocal(CacheInfo.MexContracts.key, contracts, Constants.oneMinute() * 10);
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
    // Fetch base settings (non-paginated parts)
    const base = await this.graphQlService.getExchangeServiceData(settingsBaseQuery);
    if (!base) {
      return null;
    }

    // Page through pairs to avoid one heavy query
    const pageSize = 50;
    let cursor: string | undefined = undefined;
    let hasNext = true;
    const pairs: { address: string }[] = [];

    while (hasNext) {
      const variables = {
        pagination: cursor ? { first: pageSize, after: cursor } : { first: pageSize },
        filters: { state: ["Active"] },
      };

      const page = await this.graphQlService.getExchangeServiceData(
        paginatedPairsAddressesQuery,
        variables,
      );

      if (!page || !page.filteredPairs) {
        break;
      }

      const edges: Array<{ cursor: string; node: { address: string } }> = page.filteredPairs.edges || [];
      for (const edge of edges) {
        pairs.push({ address: edge.node.address });
      }

      hasNext = page.filteredPairs.pageInfo?.hasNextPage === true;
      cursor = edges.length > 0 ? edges[edges.length - 1].cursor : cursor;

      if (!hasNext) {
        break;
      }
    }

    const transformedResponse = {
      ...base,
      pairs,
    };

    const settings = MexSettings.fromQueryResponse(transformedResponse);
    return settings;
  }

  getWegldId(): string | undefined {
    return this.wegldId;
  }

  // Pair count no longer needed; pagination uses fixed page size.
}
