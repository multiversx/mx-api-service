import { ShardTransaction } from "@elrondnetwork/transaction-processor";
import { TestingModule, Test } from "@nestjs/testing";
import { WebSocketPublisherController } from "src/common/websockets/web-socket-publisher-controller";
import { WebSocketPublisherService } from "src/common/websockets/web-socket-publisher-service";

describe('WebSocketPublisherController', () => {
  let controller: WebSocketPublisherController;
  let webSocketPublisherService: WebSocketPublisherService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WebSocketPublisherController],
      providers: [
        {
          provide: WebSocketPublisherService,
          useValue: {
            onTransactionCompleted: jest.fn(),
            onTransactionPendingResults: jest.fn(),
            onBatchUpdated: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<WebSocketPublisherController>(WebSocketPublisherController);
    webSocketPublisherService = module.get<WebSocketPublisherService>(WebSocketPublisherService);
  });

  it('should handle transactionsCompleted event', async () => {
    const mockTransactions = [{}, {}] as ShardTransaction[];
    await controller.transactionsCompleted(mockTransactions);
    expect(webSocketPublisherService.onTransactionCompleted).toHaveBeenCalledTimes(mockTransactions.length);
  });

  it('should handle transactionsPendingResults event', async () => {
    const mockTransactions = [{}, {}] as ShardTransaction[];
    await controller.transactionsPendingResults(mockTransactions);
    expect(webSocketPublisherService.onTransactionPendingResults).toHaveBeenCalledTimes(mockTransactions.length);
  });

  it('should handle onBatchUpdated event', () => {
    const mockPayload = { address: 'testAddress', batchId: 'testBatchId', txHashes: ['hash1', 'hash2'] };
    controller.onBatchUpdated(mockPayload);
    expect(webSocketPublisherService.onBatchUpdated).toHaveBeenCalledWith(mockPayload.address, mockPayload.batchId, mockPayload.txHashes);
    expect(webSocketPublisherService.onBatchUpdated).toHaveBeenCalledTimes(1);
  });
});
