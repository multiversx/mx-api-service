import { Test } from '@nestjs/testing';
import { PublicAppModule } from 'src/public.app.module';
import { MiniBlockService } from 'src/endpoints/miniblocks/mini.block.service';
import Initializer from './e2e-init';
import { Constants, ElasticService } from '@elrondnetwork/erdnest';
import { MiniBlockDetailed } from 'src/endpoints/miniblocks/entities/mini.block.detailed';

describe('MiniBlock Service', () => {
  let miniBlockService: MiniBlockService;
  const miniBlock = {
    miniBlockHash: 'e336ba1b720bb153b4e0d2049d722b0e39bf275f9d35e79b0f757271a963ad4c',
    receiverBlockHash: 'ee60ef38ab592d4a32a3ba5783996ae72afda9d2bf40295fcf7c43915120227f',
    receiverShard: 2,
    senderBlockHash: 'ee60ef38ab592d4a32a3ba5783996ae72afda9d2bf40295fcf7c43915120227f',
    senderShard: 2,
    timestamp: 1644529902,
    type: 'TxBlock',
  };

  beforeAll(async () => {
    await Initializer.initialize();
    const publicAppModule = await Test.createTestingModule({
      imports: [PublicAppModule],

    }).compile();

    miniBlockService = publicAppModule.get<MiniBlockService>(MiniBlockService);
  }, Constants.oneHour() * 1000);

  describe('getMiniBlock', () => {
    it('should return miniblock details', async () => {
      const hash: string = "e336ba1b720bb153b4e0d2049d722b0e39bf275f9d35e79b0f757271a963ad4c";
      jest
        .spyOn(ElasticService.prototype, 'getItem')
        // eslint-disable-next-line require-await
        .mockImplementation(jest.fn(async () => miniBlock));

      const results = await miniBlockService.getMiniBlock(hash);
      expect(results).toHaveStructure(Object.keys(new MiniBlockDetailed()));
      expect(results.miniBlockHash).toStrictEqual('e336ba1b720bb153b4e0d2049d722b0e39bf275f9d35e79b0f757271a963ad4c');
    });
  });
});
