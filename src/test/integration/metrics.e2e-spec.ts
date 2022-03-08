import { MetricsService } from 'src/common/metrics/metrics.service';
import { EsdtModule } from '../../endpoints/esdt/esdt.module';
import { Test } from '@nestjs/testing';
import { Constants } from 'src/utils/constants';
import Initializer from './e2e-init';

describe('Metrics Service', () => {
  let metricsService: MetricsService;

  beforeAll(async () => {
    await Initializer.initialize();

    const moduleRef = await Test.createTestingModule({
      imports: [EsdtModule],
    }).compile();

    metricsService = moduleRef.get<MetricsService>(MetricsService);

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
