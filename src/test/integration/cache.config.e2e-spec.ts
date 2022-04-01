import { ProtocolService } from '../../common/protocol/protocol.service';
import { PublicAppModule } from '../../public.app.module';
import { CacheConfigService } from '../../common/caching/cache.config.service';
import { Test } from '@nestjs/testing';
import { Constants } from 'src/utils/constants';
import Initializer from './e2e-init';

describe('Cache Config Service', () => {
  let cacheConfigService: CacheConfigService;

  beforeAll(async () => {
    await Initializer.initialize();

    const moduleRef = await Test.createTestingModule({
      imports: [PublicAppModule],
    }).compile();

    cacheConfigService = moduleRef.get<CacheConfigService>(CacheConfigService);

  }, Constants.oneHour() * 1000);

  it("should return ttl value", async () => {
    jest
      .spyOn(ProtocolService.prototype, 'getSecondsRemainingUntilNextRound')
      // eslint-disable-next-line require-await
      .mockImplementation(async () => Promise.resolve(10));

    const create = await cacheConfigService.createCacheOptions();
    expect(create).toStrictEqual({ ttl: 10 });
  });
});
