import { Injectable, Logger } from "@nestjs/common";
import simpleGit, {SimpleGit, SimpleGitOptions} from 'simple-git';
import { TokenAssets } from "src/endpoints/tokens/entities/token.assets";
import { ApiConfigService } from "./api.config.service";
import { CachingService } from "./caching.service";
import { getDirectories } from "./helpers";
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

  async checkout() {
    const localGitPath = 'dist/repos/assets';
    let logger = this.logger;
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
        stderr.pipe(process.stderr)

        stdout.on('data', (data) => {
            // Print data
            logger.log(data.toString('utf8'));
        })
      }).clone('https://github.com/ElrondNetwork/assets.git', localGitPath);
    });
  }

  private readAssetDetails(tokenIdentifier: string, assetPath: string): TokenAssets {
    let jsonPath = path.join(assetPath, 'info.json');
    let jsonContents = fs.readFileSync(jsonPath);
    let json = JSON.parse(jsonContents);

    return {
      website: json.website,
      description: json.description,
      status: json.status,
      pngUrl: this.getImageUrl(tokenIdentifier, 'logo.png'),
      svgUrl: this.getImageUrl(tokenIdentifier, 'logo.svg'),
    };
  }

  private getImageUrl(tokenIdentifier: string, name: string) {
    let tokensRelativePath = this.getTokensRelativePath();

    return `https://github.com/ElrondNetwork/assets/raw/master/${tokensRelativePath}/${tokenIdentifier}/${name}`;
  }

  private getTokensPath() {
    return path.join(process.cwd(), 'dist/repos/assets', this.getTokensRelativePath());
  }

  private getTokensRelativePath() {
    let network = this.apiConfigService.getNetwork();
    if (network !== 'mainnet') {
      return path.join(network, 'tokens');
    }

    return 'tokens';
  }

  private async readAssets() {
    // read all folders from dist/repos/assets/tokens (token identifiers)
    let tokensPath = this.getTokensPath();
    if (!fs.existsSync(tokensPath)) {
      return await this.cachingService.setCacheLocal('tokenAssets', {});
    }
    
    let tokenIdentifiers = getDirectories(tokensPath);
    
    // for every folder, create a TokenAssets entity with the contents of info.json and the urls from github
    let assets: { [key: string]: TokenAssets } = {};
    for (let tokenIdentifier of tokenIdentifiers) {
      let tokenPath = path.join(tokensPath, tokenIdentifier);
      assets[tokenIdentifier] = this.readAssetDetails(tokenIdentifier, tokenPath);
    }

    // create a dictionary with the being the token identifier and the value the TokenAssets entity and store it in the cache
    return await this.cachingService.setCacheLocal('tokenAssets', assets);
  }

  private async getOrReadAssets() {
    let assets = await this.cachingService.getCacheLocal<{ [key: string] : TokenAssets }>('tokenAssets');
    if (!assets) {
      assets = await this.readAssets();
    }

    return assets;
  }

  async getAssets(tokenIdentifier: string): Promise<TokenAssets> {
    // get the dictionary from the local cache
    let assets = await this.getOrReadAssets();

    // if the tokenIdentifier key exists in the dictionary, return the associated value, else undefined
    return assets[tokenIdentifier];
  }
}