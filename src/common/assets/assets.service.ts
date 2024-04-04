import { Injectable } from "@nestjs/common";
import simpleGit, { SimpleGit, SimpleGitOptions } from 'simple-git';
import { CacheInfo } from "src/utils/cache.info";
import { TokenAssets } from "src/common/assets/entities/token.assets";
import { ApiConfigService } from "../api-config/api.config.service";
import { AccountAssets } from "./entities/account.assets";
import { CacheService } from "@multiversx/sdk-nestjs-cache";
import { FileUtils, OriginLogger } from "@multiversx/sdk-nestjs-common";
import { ApiUtils } from "@multiversx/sdk-nestjs-http";
import { MexPair } from "src/endpoints/mex/entities/mex.pair";
import { Identity } from "src/endpoints/identities/entities/identity";
import { MexFarm } from "src/endpoints/mex/entities/mex.farm";
import { MexSettings } from "src/endpoints/mex/entities/mex.settings";
import { DnsContracts } from "src/utils/dns.contracts";
import { NftRankAlgorithm } from "./entities/nft.rank.algorithm";
import { NftRank } from "./entities/nft.rank";
import { MexStakingProxy } from "src/endpoints/mex/entities/mex.staking.proxy";
import { Provider } from "src/endpoints/providers/entities/provider";

const rimraf = require("rimraf");
const path = require('path');
const fs = require('fs');

@Injectable()
export class AssetsService {
  private readonly logger = new OriginLogger(AssetsService.name);

  constructor(
    private readonly cachingService: CacheService,
    private readonly apiConfigService: ApiConfigService,
  ) { }

  checkout(): Promise<void> {
    const localGitPath = 'dist/repos/assets';
    const logger = this.logger;
    return new Promise((resolve, reject) => {
      rimraf(localGitPath, function () {
        logger.log("done deleting");

        const options: Partial<SimpleGitOptions> = {
          baseDir: process.cwd(),
          binary: 'git',
          maxConcurrentProcesses: 6,
        };

        // when setting all options in a single object
        const git: SimpleGit = simpleGit(options);

        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        git.outputHandler((_, stdout, stderr) => {
          stdout.pipe(process.stdout);
          stderr.pipe(process.stderr);

          stdout.on('data', (data) => {
            // Print data
            logger.log(data.toString('utf8'));
          });
        }).clone('https://github.com/multiversx/mx-assets.git', localGitPath, undefined, (err) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
      });
    });
  }

  private readTokenAssetDetails(tokenIdentifier: string, assetPath: string): TokenAssets {
    const infoPath = path.join(assetPath, 'info.json');
    const info = JSON.parse(fs.readFileSync(infoPath));

    return new TokenAssets({
      ...info,
      pngUrl: this.getImageUrl(tokenIdentifier, 'logo.png'),
      svgUrl: this.getImageUrl(tokenIdentifier, 'logo.svg'),
    });
  }

  private readTokenRanks(assetPath: string): NftRank[] | undefined {
    const ranksPath = path.join(assetPath, 'ranks.json');
    if (fs.existsSync(ranksPath)) {
      return JSON.parse(fs.readFileSync(ranksPath));
    }

    return undefined;
  }

  private readAccountAssets(path: string): AccountAssets {
    const jsonContents = fs.readFileSync(path);
    const json = JSON.parse(jsonContents);

    return ApiUtils.mergeObjects(new AccountAssets(), json);
  }

  private getImageUrl(tokenIdentifier: string, name: string) {
    if (['mainnet', 'devnet', 'testnet'].includes(this.apiConfigService.getNetwork())) {
      return `${this.apiConfigService.getExternalMediaUrl()}/tokens/asset/${tokenIdentifier}/${name}`;
    }

    return `https://raw.githubusercontent.com/multiversx/mx-assets/master/${this.apiConfigService.getNetwork()}/tokens/${tokenIdentifier}/${name}`;
  }

  private getTokenAssetsPath() {
    return path.join(process.cwd(), 'dist/repos/assets', this.getRelativePath('tokens'));
  }

  private getAccountAssetsPath() {
    return path.join(process.cwd(), 'dist/repos/assets', this.getRelativePath('accounts'));
  }

  getIdentityAssetsPath() {
    return path.join(process.cwd(), 'dist/repos/assets', this.getRelativePath('identities'));
  }

  getIdentityInfoJsonPath(identity: string): string {
    return path.join(this.getIdentityAssetsPath(), identity, 'info.json');
  }

  private getRelativePath(name: string): string {
    const network = this.apiConfigService.getNetwork();
    if (network !== 'mainnet') {
      return path.join(network, name);
    }

    return name;
  }

  async getAllTokenAssets(): Promise<{ [key: string]: TokenAssets }> {
    return await this.cachingService.getOrSet(
      CacheInfo.TokenAssets.key,
      async () => await this.getAllTokenAssetsRaw(),
      CacheInfo.TokenAssets.ttl,
    );
  }

  getAllTokenAssetsRaw(): { [key: string]: TokenAssets } {
    const tokensPath = this.getTokenAssetsPath();
    if (!fs.existsSync(tokensPath)) {
      return {};
    }

    const tokenIdentifiers = FileUtils.getDirectories(tokensPath);

    // for every folder, create a TokenAssets entity with the contents of info.json and the urls from github
    const assets: { [key: string]: TokenAssets } = {};
    for (const tokenIdentifier of tokenIdentifiers) {
      const tokenPath = path.join(tokensPath, tokenIdentifier);
      try {
        assets[tokenIdentifier] = this.readTokenAssetDetails(tokenIdentifier, tokenPath);
      } catch (error) {
        this.logger.error(`An error occurred while reading assets for token with identifier '${tokenIdentifier}'`);
        this.logger.error(error);
      }
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
    const allTokenAssets = await this.getAllTokenAssets();

    const result: { [key: string]: NftRank[] } = {};
    const assetsPath = this.getTokenAssetsPath();

    for (const identifier of Object.keys(allTokenAssets)) {
      const assets = allTokenAssets[identifier];
      if (assets.preferredRankAlgorithm === NftRankAlgorithm.custom) {
        const tokenAssetsPath = path.join(assetsPath, identifier);
        const ranks = this.readTokenRanks(tokenAssetsPath);
        if (ranks) {
          result[identifier] = ranks;
        }
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

  getAllAccountAssetsRaw(providers?: Provider[], identities?: Identity[], pairs?: MexPair[], farms?: MexFarm[], mexSettings?: MexSettings, stakingProxies?: MexStakingProxy[]): { [key: string]: AccountAssets } {
    const accountAssetsPath = this.getAccountAssetsPath();
    if (!fs.existsSync(accountAssetsPath)) {
      return {};
    }
    const fileNames = FileUtils.getFiles(accountAssetsPath);

    const allAssets: { [key: string]: AccountAssets } = {};
    for (const fileName of fileNames) {
      if (fileName.includes(".gitkeep")) {
        continue;
      }
      const assetsPath = path.join(accountAssetsPath, fileName);
      const address = fileName.removeSuffix('.json');
      try {
        const assets = this.readAccountAssets(assetsPath);
        if (assets.icon) {
          const relativePath = this.getRelativePath(`accounts/icons/${assets.icon}`);
          assets.iconPng = `https://raw.githubusercontent.com/multiversx/mx-assets/master/${relativePath}.png`;
          assets.iconSvg = `https://raw.githubusercontent.com/multiversx/mx-assets/master/${relativePath}.svg`;

          delete assets.icon;
        }

        allAssets[address] = assets;
      } catch (error) {
        this.logger.error(`An error occurred while reading assets for account with address '${address}'`);
        this.logger.error(error);
      }
    }

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
        allAssets[pair.address] = new AccountAssets({
          name: `xExchange: ${pair.baseSymbol}/${pair.quoteSymbol} Liquidity Pool`,
          tags: ['xexchange', 'liquiditypool'],
        });
      }
    }

    if (farms) {
      for (const farm of farms) {
        allAssets[farm.address] = new AccountAssets({
          name: `xExchange: ${farm.name} Farm`,
          tags: ['xexchange', 'farm'],
        });
      }
    }

    if (mexSettings) {
      for (const [index, wrapContract] of mexSettings.wrapContracts.entries()) {
        allAssets[wrapContract] = new AccountAssets({
          name: `ESDT: WrappedEGLD Contract Shard ${index}`,
          tags: ['xexchange', 'wegld'],
        });
      }

      allAssets[mexSettings.lockedAssetContract] = new AccountAssets({
        name: `xExchange: Locked asset Contract`,
        tags: ['xexchange', 'lockedasset'],
      });

      allAssets[mexSettings.distributionContract] = new AccountAssets({
        name: `xExchange: Distribution Contract`,
        tags: ['xexchange', 'lockedasset'],
      });
    }

    if (stakingProxies) {
      for (const stakingProxy of stakingProxies) {
        allAssets[stakingProxy.address] = new AccountAssets({
          name: `xExchange: ${stakingProxy.dualYieldTokenName} Contract`,
          tags: ['xexchange', 'metastaking'],
        });
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
    // get the dictionary from the local cache
    const assets = await this.getAllTokenAssets();

    // if the tokenIdentifier key exists in the dictionary, return the associated value, else undefined
    return assets[tokenIdentifier];
  }
}
