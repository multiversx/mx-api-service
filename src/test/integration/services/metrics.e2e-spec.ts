import { ApiMetricsService } from 'src/common/metrics/api.metrics.service';
import { Test } from '@nestjs/testing';
import { PublicAppModule } from 'src/public.app.module';

describe('Metrics Service', () => {
  let metricsService: ApiMetricsService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [PublicAppModule],
    }).compile();

    metricsService = moduleRef.get<ApiMetricsService>(ApiMetricsService);
  });

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
