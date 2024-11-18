import { Injectable } from "@nestjs/common";
import { ApiConfigService } from "src/common/api-config/api.config.service";

@Injectable()
export class MediaService {
  constructor(
    private readonly apiConfigService: ApiConfigService,
  ) { }

  getRedirectUrl(uri: string): string | undefined {
    // nfts assets' ipfs mirror
    if (uri.startsWith('nfts/asset/')) {
      const ipfsUri = uri.replace('nfts/asset/', 'ipfs/');
      return `https://ipfs.io/${ipfsUri}`;
    }

    // providers logos
    if (uri.startsWith('/providers/asset/')) {
      const awsUri = uri.replace('providers/asset/', 'keybase_processed_uploads/');
      return `https://s3.amazonaws.com/${awsUri}`;
    }

    // esdts logos
    if (uri.startsWith('tokens/asset/')) {
      const network = this.apiConfigService.getNetwork();
      const tokenUri = network === 'mainnet'
        ? uri.replace('tokens/asset/', 'multiversx/mx-assets/master/tokens/')
        : uri.replace('tokens/asset/', `multiversx/mx-assets/master/${network}/tokens/`);
      return `https://raw.githubusercontent.com/${tokenUri}`;
    }

    return undefined;
  }
}
