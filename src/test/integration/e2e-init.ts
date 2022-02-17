import { Test } from "@nestjs/testing";
import { ApiConfigService } from "src/common/api-config/api.config.service";
import { CachingService } from "src/common/caching/caching.service";
import { CacheInfo } from "src/common/caching/entities/cache.info";
import { KeybaseIdentity } from "src/common/keybase/entities/keybase.identity";
import { KeybaseService } from "src/common/keybase/keybase.service";
import { EsdtService } from "src/endpoints/esdt/esdt.service";
import { NodeService } from "src/endpoints/nodes/node.service";
import { ProviderService } from "src/endpoints/providers/provider.service";
import { TokenProperties } from "src/endpoints/tokens/entities/token.properties";
import { PublicAppModule } from "src/public.app.module";
import { Constants } from "src/utils/constants";
import { FileUtils } from "src/utils/file.utils";
import "../../utils/extensions/jest.extensions";

export default class Initializer {
  private static cachingService: CachingService;
  private static apiConfigService: ApiConfigService;

  static async initialize() {
    const publicAppModule = await Test.createTestingModule({
      imports: [PublicAppModule],
    }).compile();

    Initializer.cachingService =
      publicAppModule.get<CachingService>(CachingService);
    Initializer.apiConfigService =
      publicAppModule.get<ApiConfigService>(ApiConfigService);
    const keybaseService = publicAppModule.get<KeybaseService>(KeybaseService);
    const nodeService = publicAppModule.get<NodeService>(NodeService);
    const providerService = publicAppModule.get<ProviderService>(ProviderService);
    const esdtService = publicAppModule.get<EsdtService>(EsdtService);

    if (Initializer.apiConfigService.getMockKeybases()) {
      jest
        .spyOn(KeybaseService.prototype, 'confirmKeybase')
        // eslint-disable-next-line require-await
        .mockImplementation(jest.fn(async () => true));
      jest
        .spyOn(KeybaseService.prototype, 'getProfile')
        // eslint-disable-next-line require-await
        .mockImplementation(jest.fn(async () => new KeybaseIdentity()));
    }

    if (Initializer.apiConfigService.getMockTokens()) {
      jest
        .spyOn(EsdtService.prototype, 'getEsdtTokenPropertiesRaw')
        // eslint-disable-next-line require-await
        .mockImplementation(jest.fn(async () => new TokenProperties()));
    }

    if (Initializer.apiConfigService.getMockNodes()) {
      const MOCK_PATH = Initializer.apiConfigService.getMockPath();
      const heartbeat = FileUtils.parseJSONFile(
        `${MOCK_PATH}heartbeat.mock.json`,
      );
      jest
        .spyOn(NodeService.prototype, 'getHeartbeat')
        // eslint-disable-next-line require-await
        .mockImplementation(jest.fn(async () => heartbeat));

      const queue = FileUtils.parseJSONFile(`${MOCK_PATH}queue.mock.json`);
      jest
        .spyOn(NodeService.prototype, 'getQueue')
        // eslint-disable-next-line require-await
        .mockImplementation(jest.fn(async () => queue));
    }

    const isInitialized =
      await Initializer.cachingService.getCacheRemote<boolean>('isInitialized');
    if (isInitialized === true) {
      return;
    }

    await this.execute(
      'Flushing db',
      async () => await Initializer.cachingService.flushDb(),
    );

    await this.execute('Confirm keybases against keybase.pub', async () => await keybaseService.confirmKeybasesAgainstKeybasePub());
    await this.execute('Confirm keybase against keybase.io', async () => await keybaseService.confirmIdentityProfilesAgainstKeybaseIo());
    await this.fetch(CacheInfo.Keybases.key, async () => await keybaseService.confirmKeybasesAgainstCache());
    await this.fetch(CacheInfo.Nodes.key, async () => await nodeService.getAllNodesRaw());
    await this.fetch(CacheInfo.Providers.key, async () => await providerService.getAllProvidersRaw());
    await this.fetch(CacheInfo.AllEsdtTokens.key, async () => await esdtService.getAllEsdtTokensRaw());

    await Initializer.cachingService.setCacheRemote<boolean>(
      'isInitialized',
      true,
      Constants.oneHour(),
    );
  }

  private static async fetch<T>(key: string, promise: () => Promise<T>) {
    const description = `Fetching ${key}`;

    await this.execute(description, async () => {
      const value = await promise();
      await Initializer.cachingService.setCache(key, value, Constants.oneHour());
    });
  }

  private static async execute(
    description: string,
    promise: () => Promise<any>,
  ) {
    console.log(`${new Date().toISODateString()}: ${description}`);
    const start = Date.now();
    await promise();
    const duration = ((Date.now() - start) / 1000).toFixed(2);
    console.log(
      `${new Date().toISODateString()}: ${description} completed. Duration: ${duration}s`,
    );
  }
}
