import { TestingModule, Test } from "@nestjs/testing";
import { NftQueueModule } from "src/queue.worker/nft.worker/queue/nft.queue.module";
import { QueueWorkerModule } from "src/queue.worker/queue.worker.module";

describe('QueueWorkerModule', () => {
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [QueueWorkerModule],
    }).compile();
  });

  it('should have NftQueueModule imported', () => {
    const importedModule = module.get<NftQueueModule>(NftQueueModule);
    expect(importedModule).toBeDefined();
  });
});
