import { Test } from "@nestjs/testing";
import { ApiConfigService } from "src/common/api.config.service";
import { CachingService } from "src/common/caching.service";
import { KeybaseIdentity } from "src/common/entities/keybase.identity";
import { KeybaseService } from "src/common/keybase.service";
import { NodeService } from "src/endpoints/nodes/node.service";
import { ProviderService } from "src/endpoints/providers/provider.service";
import { PublicAppModule } from "src/public.app.module";
import { Constants } from "src/utils/constants";
import "../../utils/extensions/jest.extensions";

export default class Initializer {
  private static cachingService: CachingService;
  private static apiConfigService: ApiConfigService;

  static async initialize() {
    const publicAppModule = await Test.createTestingModule({
      imports: [PublicAppModule],
    }).compile();

    if (Initializer.apiConfigService.getMockKeybases()) {
      jest.spyOn(KeybaseService.prototype, "confirmKeybase").mockImplementation(jest.fn(async() => true));
      jest.spyOn(KeybaseService.prototype, "getProfile").mockImplementation(jest.fn(async() => new KeybaseIdentity()));
    }

    Initializer.cachingService = publicAppModule.get<CachingService>(CachingService);
    const keybaseService = publicAppModule.get<KeybaseService>(KeybaseService);
    const nodeService = publicAppModule.get<NodeService>(NodeService);
    const providerService = publicAppModule.get<ProviderService>(ProviderService);

    let isInitialized = await Initializer.cachingService.getCacheRemote<boolean>('isInitialized');
    if (isInitialized === true) {
      return;
    }

    await this.execute('Flushing db', async () => await Initializer.cachingService.flushDb());

    await this.fetch('nodeKeybases', async () => await keybaseService.confirmKeybaseNodesAgainstKeybasePub());
    await this.fetch('providerKeybases', async () => await keybaseService.confirmKeybaseProvidersAgainstKeybasePub());
    await this.fetch('nodes', async () => await nodeService.getAllNodesRaw());
    await this.fetch('providers', async () => await providerService.getAllProvidersRaw());

    await Initializer.cachingService.setCacheRemote<boolean>('isInitialized', true, Constants.oneHour());
  }

  private static async fetch<T>(key: string, promise: () => Promise<T>) {
    let description = `Fetching ${key}`;

    await this.execute(description, async () => {
      let value = await promise();
      Initializer.cachingService.setCache(key, value, Constants.oneHour());
    });
  }

  private static async execute(description: string, promise: () => Promise<any>) {
    console.log(`${new Date().toISOString().substr(11, 8)}: ${description}`);
    let start = Date.now();
    await promise();
    let duration = ((Date.now() - start) / 1000).toFixed(2);
    console.log(`${new Date().toISOString().substr(11, 8)}: ${description} completed. Duration: ${duration}s`);
  }
}