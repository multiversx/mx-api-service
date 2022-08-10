import { ApiMetricsService } from 'src/common/metrics/api.metrics.service';
import { Test } from '@nestjs/testing';
import Initializer from './e2e-init';
import { Constants } from '@elrondnetwork/erdnest';
import { EsdtModule } from 'src/endpoints/esdt/esdt.module';

describe('Metrics Service', () => {
  let metricsService: ApiMetricsService;

  beforeAll(async () => {
    await Initializer.initialize();

    const moduleRef = await Test.createTestingModule({
      imports: [EsdtModule],
    }).compile();

    metricsService = moduleRef.get<ApiMetricsService>(ApiMetricsService);

  }, Constants.oneHour() * 1000);


  it("should return current nonce for shard 1", async () => {
    const shard: number = 1;
    const nonce = await metricsService.getCurrentNonce(shard);

    expect(typeof nonce).toBe("number");
  });

  it("should return metrics", async () => {
    const details = await metricsService.getMetrics();

    expect(typeof details).toBe("string");
  });
});
