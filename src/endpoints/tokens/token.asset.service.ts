import { Injectable, Logger } from "@nestjs/common";
import simpleGit, { SimpleGit, SimpleGitOptions } from 'simple-git';
import { CacheInfo } from "src/common/caching/entities/cache.info";
import { TokenAssets } from "src/endpoints/tokens/entities/token.assets";
import { FileUtils } from "src/utils/file.utils";
import { ApiConfigService } from "../../common/api-config/api.config.service";
import { CachingService } from "../../common/caching/caching.service";
const rimraf = require("rimraf");
const path = require('path');
const fs = require('fs');

@Injectable()
export class TokenAssetService {
  private readonly logger: Logger;

  constructor(
    private readonly cachingService: CachingService,
    private readonly apiConfigService: ApiConfigService
  ) {
    this.logger = new Logger(TokenAssetService.name);
  }

  async checkout(): Promise<void> {
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

        git.outputHandler((_, stdout, stderr) => {
          stdout.pipe(process.stdout);
          stderr.pipe(process.stderr);

          stdout.on('data', (data) => {
            // Print data
            logger.log(data.toString('utf8'));
          });
        }).clone('https://github.com/ElrondNetwork/assets.git', localGitPath, undefined, (err, data) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
      });
    });
  }

  private readAssetDetails(tokenIdentifier: string, assetPath: string): TokenAssets {
    const jsonPath = path.join(assetPath, 'info.json');
    const jsonContents = fs.readFileSync(jsonPath);
    const json = JSON.parse(jsonContents);

    return {
      ...json,
      pngUrl: this.getImageUrl(tokenIdentifier, 'logo.png'),
      svgUrl: this.getImageUrl(tokenIdentifier, 'logo.svg'),
    };
  }

  private getImageUrl(tokenIdentifier: string, name: string) {
    return `${this.apiConfigService.getExternalMediaUrl()}/tokens/asset/${tokenIdentifier}/${name}`;
  }

  private getTokensPath() {
    return path.join(process.cwd(), 'dist/repos/assets', this.getTokensRelativePath());
  }

  private getTokensRelativePath() {
    const network = this.apiConfigService.getNetwork();
    if (network !== 'mainnet') {
      return path.join(network, 'tokens');
    }

    return 'tokens';
  }

  async getAllAssets(): Promise<{ [key: string]: TokenAssets }> {
    return this.cachingService.getOrSetCache(
      CacheInfo.TokenAssets.key,
      async () => await this.getAllAssetsRaw(),
      CacheInfo.TokenAssets.ttl
    );
  }

  async getAllAssetsRaw(): Promise<{ [key: string]: TokenAssets }> {
    const tokensPath = this.getTokensPath();
    if (!fs.existsSync(tokensPath)) {
      return {};
    }

    const tokenIdentifiers = FileUtils.getDirectories(tokensPath);

    // for every folder, create a TokenAssets entity with the contents of info.json and the urls from github
    const assets: { [key: string]: TokenAssets } = {};
    for (const tokenIdentifier of tokenIdentifiers) {
      const tokenPath = path.join(tokensPath, tokenIdentifier);
      try {
        assets[tokenIdentifier] = this.readAssetDetails(tokenIdentifier, tokenPath);
      } catch (error) {
        this.logger.error(`An error ocurred while reading assets for token with identifier '${tokenIdentifier}'`);
        this.logger.error(error);
      }
    }

    return assets;
  }

  async getAssets(tokenIdentifier: string): Promise<TokenAssets | undefined> {
    // get the dictionary from the local cache
    const assets = await this.getAllAssets();

    // if the tokenIdentifier key exists in the dictionary, return the associated value, else undefined
    return assets[tokenIdentifier];
  }
}