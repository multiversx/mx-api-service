import { TestingModule, Test } from "@nestjs/testing";
import { ApiMetricsController } from "src/common/metrics/api.metrics.controller";
import { RemoteCacheController } from "src/endpoints/caching/remote.cache.controller";
import { HealthCheckController } from "src/endpoints/health-check/health.check.controller";
import { ProcessNftsPrivateController } from "src/endpoints/process-nfts/process.nfts.private.controller";
import { PrivateAppModule } from "src/private.app.module";

describe('PrivateAppModule', () => {
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [PrivateAppModule],
    }).compile();
  });

  it('should have ApiMetricsController', () => {
    const controller = module.get<ApiMetricsController>(ApiMetricsController);
    expect(controller).toBeDefined();
  });

  it('should have RemoteCacheController', () => {
    const controller = module.get<RemoteCacheController>(RemoteCacheController);
    expect(controller).toBeDefined();
  });

  it('should have HealthCheckController', () => {
    const controller = module.get<HealthCheckController>(HealthCheckController);
    expect(controller).toBeDefined();
  });

  it('should have ProcessNftsPrivateController', () => {
    const controller = module.get<ProcessNftsPrivateController>(ProcessNftsPrivateController);
    expect(controller).toBeDefined();
  });
});
