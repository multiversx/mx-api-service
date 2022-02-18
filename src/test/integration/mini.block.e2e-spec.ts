import { Test } from '@nestjs/testing';
import { PublicAppModule } from 'src/public.app.module';
import { Constants } from 'src/utils/constants';
import miniBlockDetails from '../data/block/mini.blockDetailed';
import { MiniBlockService } from '../../endpoints/miniblocks/mini.block.service';
import Initializer from './e2e-init';
describe('MiniBlock Service', () => {
  let miniBlockService: MiniBlockService;


  beforeAll(async () => {
    await Initializer.initialize();
    const publicAppModule = await Test.createTestingModule({
      imports: [PublicAppModule],

    }).compile();

    miniBlockService = publicAppModule.get<MiniBlockService>(MiniBlockService);
  }, Constants.oneHour() * 1000);

  describe('getMiniBlock', () => {
    it('should return miniblock details', async () => {
      const block = await miniBlockService.getMiniBlock(miniBlockDetails.miniBlockHash);
      expect(typeof block).toBe('object');
      expect(block.hasOwnProperty('miniBlockHash')).toBe(true);
      expect(block.hasOwnProperty('receiverBlockHash')).toBe(true);
      expect(block.hasOwnProperty('receiverShard')).toBe(true);
      expect(block.hasOwnProperty('senderBlockHash')).toBe(true);
      expect(block.hasOwnProperty('senderShard')).toBe(true);
      expect(block.hasOwnProperty('timestamp')).toBe(true);
      expect(block.hasOwnProperty('type')).toBe(true);
    });
  });
});
