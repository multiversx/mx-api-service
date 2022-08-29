import { Injectable } from "@nestjs/common";
import simpleGit, { SimpleGit, SimpleGitOptions } from 'simple-git';
import { CacheInfo } from "src/utils/cache.info";
import { TokenAssets } from "src/common/assets/entities/token.assets";
import { ApiConfigService } from "../api-config/api.config.service";
import { AccountAssets } from "./entities/account.assets";
import { ApiUtils, CachingService, FileUtils, OriginLogger } from "@elrondnetwork/erdnest";
import { Provider } from "src/endpoints/providers/entities/provider";
import { MexPair } from "src/endpoints/mex/entities/mex.pair";
import { Identity } from "src/endpoints/identities/entities/identity";
import { MexFarm } from "src/endpoints/mex/entities/mex.farm";
import { MexSettings } from "src/endpoints/mex/entities/mex.settings";
import { DnsContracts } from "src/utils/dns.contracts";
const rimraf = require("rimraf");
const path = require('path');
const fs = require('fs');

@Injectable()
export class AssetsService {
  private readonly logger = new OriginLogger(AssetsService.name);

  constructor(
    private readonly cachingService: CachingService,
    private readonly apiConfigService: ApiConfigService
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
        }).clone('https://github.com/ElrondNetwork/assets.git', localGitPath, undefined, (err) => {
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
    const jsonPath = path.join(assetPath, 'info.json');
    const jsonContents = fs.readFileSync(jsonPath);
    const json = JSON.parse(jsonContents);

    return {
      ...json,
      pngUrl: this.getImageUrl(tokenIdentifier, 'logo.png'),
      svgUrl: this.getImageUrl(tokenIdentifier, 'logo.svg'),
    };
  }

  private readAccountAssets(path: string): AccountAssets {
    const jsonContents = fs.readFileSync(path);
    const json = JSON.parse(jsonContents);

    return ApiUtils.mergeObjects(new AccountAssets(), json);
  }

  private getImageUrl(tokenIdentifier: string, name: string) {
    return `${this.apiConfigService.getExternalMediaUrl()}/tokens/asset/${tokenIdentifier}/${name}`;
  }

  private getTokenAssetsPath() {
    return path.join(process.cwd(), 'dist/repos/assets', this.getRelativePath('tokens'));
  }

  private getAccountAssetsPath() {
    return path.join(process.cwd(), 'dist/repos/assets', this.getRelativePath('accounts'));
  }

  private getRelativePath(name: string): string {
    const network = this.apiConfigService.getNetwork();
    if (network !== 'mainnet') {
      return path.join(network, name);
    }

    return name;
  }

  async getAllTokenAssets(): Promise<{ [key: string]: TokenAssets }> {
    return await this.cachingService.getOrSetCache(
      CacheInfo.TokenAssets.key,
      async () => await this.getAllTokenAssetsRaw(),
      CacheInfo.TokenAssets.ttl
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

  async getAllAccountAssets(): Promise<{ [key: string]: AccountAssets }> {
    return await this.cachingService.getOrSetCache(
      CacheInfo.AccountAssets.key,
      async () => await this.getAllAccountAssetsRaw(),
      CacheInfo.AccountAssets.ttl
    );
  }

  getAllAccountAssetsRaw(providers?: Provider[], identities?: Identity[], pairs?: MexPair[], farms?: MexFarm[], mexSettings?: MexSettings): { [key: string]: AccountAssets } {
    const accountAssetsPath = this.getAccountAssetsPath();
    if (!fs.existsSync(accountAssetsPath)) {
      return {};
    }

    const fileNames = FileUtils.getFiles(accountAssetsPath);

    const allAssets: { [key: string]: AccountAssets } = {};
    for (const fileName of fileNames) {
      const assetsPath = path.join(accountAssetsPath, fileName);
      const address = fileName.removeSuffix('.json');
      try {
        const assets = this.readAccountAssets(assetsPath);
        if (assets.icon) {
          const relativePath = this.getRelativePath(`accounts/icons/${assets.icon}`);
          assets.iconPng = `https://raw.githubusercontent.com/ElrondNetwork/assets/master/${relativePath}.png`;
          assets.iconSvg = `https://raw.githubusercontent.com/ElrondNetwork/assets/master/${relativePath}.svg`;

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
          name: `Maiar Exchange: ${pair.baseSymbol}/${pair.quoteSymbol} Liquidity Pool`,
          tags: ['mex', 'liquiditypool'],
        });
      }
    }

    if (farms) {
      for (const farm of farms) {
        allAssets[farm.address] = new AccountAssets({
          name: `Maiar Exchange: ${farm.name} Farm`,
          tags: ['mex', 'farm'],
        });
      }
    }

    if (mexSettings) {
      for (const [index, wrapContract] of mexSettings.wrapContracts.entries()) {
        allAssets[wrapContract] = new AccountAssets({
          name: `ESDT: WrappedEGLD Contract Shard ${index}`,
          tags: ['mex', 'wegld'],
        });
      }

      allAssets[mexSettings.lockedAssetContract] = new AccountAssets({
        name: `Maiar Exchange: Locked asset Contract`,
        tags: ['mex', 'lockedasset'],
      });

      allAssets[mexSettings.distributionContract] = new AccountAssets({
        name: `Maiar Exchange: Distribution Contract`,
        tags: ['mex', 'lockedasset'],
      });
    }

    for (const [index, address] of DnsContracts.addresses.entries()) {
      allAssets[address] = new AccountAssets({
        name: `Elrond DNS: Contract ${index}`,
        tags: ['dns'],
        icon: 'elrond',
      });
    }

    return allAssets;
  }

  async getAssets(tokenIdentifier: string): Promise<TokenAssets | undefined> {
    // get the dictionary from the local cache
    const assets = await this.getAllTokenAssets();

    // if the tokenIdentifier key exists in the dictionary, return the associated value, else undefined
    return assets[tokenIdentifier];
  }
}
