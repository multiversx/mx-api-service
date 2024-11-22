import { Injectable } from "@nestjs/common";
import { CacheInfo } from "src/utils/cache.info";
import { TokenAssets } from "src/common/assets/entities/token.assets";
import { AccountAssets } from "./entities/account.assets";
import { CacheService } from "@multiversx/sdk-nestjs-cache";
import { MexPair } from "src/endpoints/mex/entities/mex.pair";
import { Identity } from "src/endpoints/identities/entities/identity";
import { MexFarm } from "src/endpoints/mex/entities/mex.farm";
import { MexSettings } from "src/endpoints/mex/entities/mex.settings";
import { DnsContracts } from "src/utils/dns.contracts";
import { NftRank } from "./entities/nft.rank";
import { MexStakingProxy } from "src/endpoints/mex/entities/mex.staking.proxy";
import { Provider } from "src/endpoints/providers/entities/provider";
import { ApiService } from "@multiversx/sdk-nestjs-http";
import { ApiConfigService } from "../api-config/api.config.service";
import { KeybaseIdentity } from "../keybase/entities/keybase.identity";

@Injectable()
export class AssetsService {
  constructor(
    private readonly apiConfigService: ApiConfigService,
    private readonly apiService: ApiService,
    private readonly cachingService: CacheService,
  ) { }

  async getAllTokenAssets(): Promise<{ [key: string]: TokenAssets }> {
    return await this.cachingService.getOrSet(
      CacheInfo.TokenAssets.key,
      async () => await this.getAllTokenAssetsRaw(),
      CacheInfo.TokenAssets.ttl,
    );
  }

  async getAllTokenAssetsRaw(): Promise<{ [key: string]: TokenAssets }> {
    if (!this.apiConfigService.isAssetsCdnFeatureEnabled()) {
      return {};
    }

    const assetsCdnUrl = this.apiConfigService.getAssetsCdnUrl();
    const network = this.apiConfigService.getNetwork();

    const { data: assetsRaw } = await this.apiService.get(`${assetsCdnUrl}/${network}/tokens`);

    const assets: { [key: string]: TokenAssets } = {};
    for (const asset of assetsRaw) {
      const { identifier, ...details } = asset;
      assets[identifier] = new TokenAssets(details);
    }

    return assets;
  }

  async getCollectionRanks(identifier: string): Promise<NftRank[] | undefined> {
    const allCollectionRanks = await this.getAllCollectionRanks();
    return allCollectionRanks[identifier];
  }

  async getAllCollectionRanks(): Promise<{ [key: string]: NftRank[] }> {
    return await this.cachingService.getOrSet(
      CacheInfo.CollectionRanks.key,
      async () => await this.getAllCollectionRanksRaw(),
      CacheInfo.CollectionRanks.ttl,
    );
  }

  async getAllCollectionRanksRaw(): Promise<{ [key: string]: NftRank[] }> {
    if (!this.apiConfigService.isAssetsCdnFeatureEnabled()) {
      return {};
    }

    const assetsCdnUrl = this.apiConfigService.getAssetsCdnUrl();
    const network = this.apiConfigService.getNetwork();

    const { data: assets } = await this.apiService.get(`${assetsCdnUrl}/${network}/tokens`);

    const result: { [key: string]: NftRank[] } = {};

    for (const asset of assets) {
      if (asset.ranks && asset.ranks.length > 0) {
        result[asset.identifier] = asset.ranks.map((rank: any) => new NftRank({
          identifier: rank.identifier,
          rank: rank.rank,
        }));
      }
    }

    return result;
  }

  async getAllAccountAssets(): Promise<{ [key: string]: AccountAssets }> {
    return await this.cachingService.getOrSet(
      CacheInfo.AccountAssets.key,
      async () => await this.getAllAccountAssetsRaw(),
      CacheInfo.AccountAssets.ttl,
    );
  }

  async getAllAccountAssetsRaw(providers?: Provider[], identities?: Identity[], pairs?: MexPair[], farms?: MexFarm[], mexSettings?: MexSettings, stakingProxies?: MexStakingProxy[]): Promise<{ [key: string]: AccountAssets }> {
    if (!this.apiConfigService.isAssetsCdnFeatureEnabled()) {
      return {};
    }

    const assetsCdnUrl = this.apiConfigService.getAssetsCdnUrl();
    const network = this.apiConfigService.getNetwork();

    const { data: assets } = await this.apiService.get(`${assetsCdnUrl}/${network}/accounts`);

    const allAssets: { [key: string]: AccountAssets } = {};
    for (const asset of assets) {
      const { address, ...details } = asset;
      allAssets[address] = new AccountAssets(details);
    }

    // Populate additional assets from other sources if available
    if (providers && identities) {
      for (const provider of providers) {
        const identity = identities.find(x => x.identity === provider.identity);
        if (!identity) {
          continue;
        }

        allAssets[provider.provider] = new AccountAssets({
          name: `Staking: ${identity.name ?? ''}`,
          description: identity.description ?? '',
          iconPng: identity.avatar,
          tags: ['staking', 'provider'],
        });
      }
    }

    if (pairs) {
      for (const pair of pairs) {
        allAssets[pair.address] = this.createAccountAsset(
          `xExchange: ${pair.baseSymbol}/${pair.quoteSymbol} Liquidity Pool`,
          ['xexchange', 'liquiditypool']
        );
      }
    }

    if (farms) {
      for (const farm of farms) {
        allAssets[farm.address] = this.createAccountAsset(
          `xExchange: ${farm.name} Farm`,
          ['xexchange', 'farm']
        );
      }
    }

    if (mexSettings) {
      for (const [index, wrapContract] of mexSettings.wrapContracts.entries()) {
        allAssets[wrapContract] = this.createAccountAsset(
          `ESDT: WrappedEGLD Contract Shard ${index}`,
          ['xexchange', 'wegld']
        );
      }

      allAssets[mexSettings.lockedAssetContract] = this.createAccountAsset(
        `xExchange: Locked asset Contract`,
        ['xexchange', 'lockedasset']
      );

      allAssets[mexSettings.distributionContract] = this.createAccountAsset(
        `xExchange: Distribution Contract`,
        ['xexchange', 'lockedasset']
      );
    }

    if (stakingProxies) {
      for (const stakingProxy of stakingProxies) {
        allAssets[stakingProxy.address] = this.createAccountAsset(
          `xExchange: ${stakingProxy.dualYieldTokenName} Contract`,
          ['xexchange', 'metastaking']
        );
      }
    }

    for (const [index, address] of DnsContracts.addresses.entries()) {
      allAssets[address] = new AccountAssets({
        name: `Multiversx DNS: Contract ${index}`,
        tags: ['dns'],
        icon: 'multiversx',
      });
    }

    return allAssets;
  }

  async getTokenAssets(tokenIdentifier: string): Promise<TokenAssets | undefined> {
    const assets = await this.getAllTokenAssets();
    return assets[tokenIdentifier];
  }

  async getAllIdentitiesRaw(): Promise<{ [key: string]: KeybaseIdentity }> {
    if (!this.apiConfigService.isAssetsCdnFeatureEnabled()) {
      return {};
    }

    const assetsCdnUrl = this.apiConfigService.getAssetsCdnUrl();
    const network = this.apiConfigService.getNetwork();

    const { data: assets } = await this.apiService.get(`${assetsCdnUrl}/${network}/identities`);

    const allAssets: { [key: string]: KeybaseIdentity } = {};
    for (const asset of assets) {
      allAssets[asset.identity] = new KeybaseIdentity(asset);
    }

    return allAssets;
  }

  async getIdentityInfo(identity: string): Promise<KeybaseIdentity | null> {
    const allIdentities = await this.getAllIdentitiesRaw();
    return allIdentities[identity] || null;
  }

  createAccountAsset(name: string, tags: string[]): AccountAssets {
    return new AccountAssets({
      name: name,
      tags: tags,
      iconSvg: 'https://raw.githubusercontent.com/multiversx/mx-assets/master/accounts/icons/xexchange.svg',
      iconPng: 'https://raw.githubusercontent.com/multiversx/mx-assets/master/accounts/icons/xexchange.png',
    });
  }
}
