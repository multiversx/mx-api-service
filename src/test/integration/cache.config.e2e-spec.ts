import { EsdtModule } from '../../endpoints/esdt/esdt.module';
import { CacheConfigService } from '../../common/caching/cache.config.service';
import { Test } from '@nestjs/testing';
import { Constants } from 'src/utils/constants';
import Initializer from './e2e-init';

describe('Cache Config Service', () => {
  let cacheConfigService: CacheConfigService;

  beforeAll(async () => {
    await Initializer.initialize();

    const moduleRef = await Test.createTestingModule({
      imports: [EsdtModule],
    }).compile();

    cacheConfigService = moduleRef.get<CacheConfigService>(CacheConfigService);

  }, Constants.oneHour() * 1000);

  it("should return ttl value", async () => {
    const create = await cacheConfigService.createCacheOptions();

    expect(create).toHaveProperty("ttl");
    expect(create).toBeInstanceOf(Object);
  });
});
