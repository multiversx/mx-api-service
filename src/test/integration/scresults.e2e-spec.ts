import { Test } from '@nestjs/testing';
import { PublicAppModule } from 'src/public.app.module';
import Initializer from './e2e-init';
import { Constants } from 'src/utils/constants';
import { SmartContractResultService } from 'src/endpoints/sc-results/scresult.service';
import { SmartContractResult } from 'src/endpoints/sc-results/entities/smart.contract.result';
import smartContractResults from "../mocks/smartcontract/scresults";

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
      const results = await scresultsService.getScResults({
        from: 0,
        size: 1,
      });
      expect(results).toEqual(
        expect.arrayContaining([
          expect.objectContaining({hash: smartContractResults[0].hash}),
        ])
      );
    });

    it(`should return a list with 25 scresults`, async () => {
      const results = await scresultsService.getScResults({
        from: 0,
        size: 25,
      });

      expect(results).toBeInstanceOf(Array);
      expect(results).toHaveLength(25);

      for (const result of results) {
        expect(result).toHaveStructure(
          Object.keys(new SmartContractResult()),
        );
      }
    });

    it(`should return a list with 50 scresults`, async () => {
      const results = await scresultsService.getScResults({
        from: 0,
        size: 50,
      });
      expect(results).toBeInstanceOf(Array);
      expect(results).toHaveLength(50);

      for (const result of results) {
        expect(result).toHaveStructure(
          Object.keys(new SmartContractResult()),
        );
      }
    });
  });

  describe('Scresults filters', () => {
    it(`should return a list of scresults for an account`, async () => {
      const results = await scresultsService.getAccountScResults(
        accountAddress,
        { from: 0, size: 25 },
      );
      expect(results).toBeInstanceOf(Array);

      for (const result of results) {
        expect(result).toHaveStructure(
          Object.keys(new SmartContractResult()),
        );
        expect([result.sender, result.receiver]).toContain(accountAddress);
      }
    });
  });

  describe('Scresults count', () => {
    it(`should return smart contract count`, async () => {
      const count =await scresultsService.getScResultsCount();

      expect(typeof count).toBe('number');
    });
  });

  describe('Specific scresult', () => {
    describe('Scresult Details', () => {
      it(`should return a detailed scresult with hash`, async () => {
        const result = await scresultsService.getScResult(scHash);
        expect(result).toBeDefined();
        expect(result?.hash).toStrictEqual(scHash);
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
      const count = await scresultsService.getAccountScResultsCount(accountAddress);
      expect(typeof count).toBe('number');
    });
  });
});
