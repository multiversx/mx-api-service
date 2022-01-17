import { Test } from '@nestjs/testing';
import { PublicAppModule } from 'src/public.app.module';
import Initializer from './e2e-init';
import { Constants } from 'src/utils/constants';
import { SmartContractResultService } from 'src/endpoints/sc-results/scresult.service';
import { SmartContractResult } from 'src/endpoints/sc-results/entities/smart.contract.result';

describe('Scresults Service', () => {
  let scresultsService: SmartContractResultService;
  let accountAddress: string;
  let scHash: string;

  beforeAll(async () => {
    await Initializer.initialize();
    const moduleRef = await Test.createTestingModule({
      imports: [PublicAppModule],
    }).compile();

    scresultsService = moduleRef.get<SmartContractResultService>(SmartContractResultService);

    const scresults = await scresultsService.getScResults({ from: 0, size: 1 });
    expect(scresults).toHaveLength(1);

    const scResult = scresults[0];
    accountAddress = scResult.sender;
    scHash = scresults[0].hash;
  }, Constants.oneHour() * 1000);

  describe('Scresults list', () => {
    it('scresults should have hash, nonce and timestamp', async () => {
      const scresultsList = await scresultsService.getScResults({
        from: 0,
        size: 25,
      });
      for (const scresult of scresultsList) {
        expect(scresult).toHaveProperty('hash');
        expect(scresult).toHaveProperty('nonce');
        expect(scresult).toHaveProperty('timestamp');
      }
    });

    it(`should return a list with 25 scresults`, async () => {
      const scresultsList = await scresultsService.getScResults({
        from: 0,
        size: 25,
      });

      expect(scresultsList).toBeInstanceOf(Array);
      expect(scresultsList).toHaveLength(25);

      for (const scresult of scresultsList) {
        expect(scresult).toHaveStructure(
          Object.keys(new SmartContractResult()),
        );
      }
    });

    it(`should return a list with 50 scresults`, async () => {
      const scresultsList = await scresultsService.getScResults({
        from: 0,
        size: 50,
      });
      expect(scresultsList).toBeInstanceOf(Array);
      expect(scresultsList).toHaveLength(50);

      for (const scresult of scresultsList) {
        expect(scresult).toHaveStructure(
          Object.keys(new SmartContractResult()),
        );
      }
    });
  });

  describe('Scresults filters', () => {
    it(`should return a list of scresults for an account`, async () => {
      const scresultsList = await scresultsService.getAccountScResults(
        accountAddress,
        { from: 0, size: 25 },
      );

      expect(scresultsList).toBeInstanceOf(Array);

      for (const scresult of scresultsList) {
        expect(scresult).toHaveStructure(
          Object.keys(new SmartContractResult()),
        );
        expect([scresult.sender, scresult.receiver]).toContain(accountAddress);
      }
    });
  });

  describe('Scresults count', () => {
    it(`should return a number`, async () => {
      const scresultsCount: Number = new Number(
        await scresultsService.getScResultsCount(),
      );

      expect(scresultsCount).toBeInstanceOf(Number);
    });
  });

  describe('Specific scresult', () => {
    describe('Scresult Details', () => {
      it(`should return a detailed scresult with hash`, async () => {
        const scresult = await scresultsService.getScResult(scHash);
        expect(scresult).toBeDefined();
        expect(scresult?.hash).toStrictEqual(scHash);
      });

      it(`should throw 'Smart contract result not found' error`, async () => {
        expect(
          await scresultsService.getScResult(scHash + 'a'),
        ).toBeUndefined();
      });
    });
  });

  describe('Get Results of a smart contract count', () => {
    it('should return sc results count', async () => {
      const scResults: Number =new  Number(
        await scresultsService.getAccountScResultsCount(accountAddress));
      expect(scResults).toBeInstanceOf(Number);
    });
  });
});
