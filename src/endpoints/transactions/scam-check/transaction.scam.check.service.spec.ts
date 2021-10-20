import { Test } from '@nestjs/testing';
import { CachingService } from 'src/common/caching/caching.service';
import { TransactionScamMinInfo } from 'src/common/external/entities/transaction.scam.min.info';
import { TransactionScamResult } from 'src/common/external/entities/transaction.scam.result';
import { TransactionScamType } from 'src/common/external/entities/transaction.scam.type';
import { ExtrasApiService } from 'src/common/external/extras.api.service';
import { TransactionDetailed } from '../entities/transaction.detailed';
import { PotentialScamTransactionChecker } from './potential.scam.transaction.checker';
import { TransactionScamCheckService } from './transaction.scam.check.service';

describe('TransactionScamCheckService', () => {
  let transactionScamCheckService: TransactionScamCheckService;
  let potentialScamTransactionChecker: PotentialScamTransactionChecker;
  let extrasApiService: ExtrasApiService;
  let cachingService: CachingService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        TransactionScamCheckService,
        PotentialScamTransactionChecker,
        {
          provide: ExtrasApiService,
          useValue: {
            checkScamTransaction() { return; }
          },
        },
        {
          provide: CachingService,
          useValue: {
            getOrSetCache() { return; }
          },
        }
      ],
    }).compile();

    cachingService = module.get<CachingService>(CachingService);
    extrasApiService = module.get<ExtrasApiService>(ExtrasApiService);
    potentialScamTransactionChecker = module.get<PotentialScamTransactionChecker>(PotentialScamTransactionChecker);
    transactionScamCheckService = module.get<TransactionScamCheckService>(TransactionScamCheckService);
  });

  it('potential scam checker returns false - returns null', async () => {
    // Arrange.
    const tx = new TransactionDetailed();
    jest.spyOn(potentialScamTransactionChecker, 'check').mockImplementation(() => false);
    const extrasApiScamTransactionResult = new TransactionScamResult();
    jest.spyOn(extrasApiService, 'checkScamTransaction').mockImplementation(() => Promise.resolve(extrasApiScamTransactionResult));
    jest.spyOn(cachingService, 'getOrSetCache').mockImplementation(() => extrasApiService.checkScamTransaction(new TransactionScamMinInfo()));

    // Act.
    const result = await transactionScamCheckService.getScamInfo(tx);

    // Assert.
    expect(result).toBeUndefined();
    expect(potentialScamTransactionChecker.check).toHaveBeenCalled();
    expect(cachingService.getOrSetCache).not.toHaveBeenCalled();
    expect(extrasApiService.checkScamTransaction).not.toHaveBeenCalled();
  });

  it('scam transaction result is null - returns null', async () => {
    // Arrange.
    const tx = new TransactionDetailed();
    jest.spyOn(potentialScamTransactionChecker, 'check').mockImplementation(() => true);
    jest.spyOn(extrasApiService, 'checkScamTransaction').mockImplementation(() => Promise.resolve(null));
    jest.spyOn(cachingService, 'getOrSetCache').mockImplementation(() => extrasApiService.checkScamTransaction(new TransactionScamMinInfo()));

    // Act.
    const result = await transactionScamCheckService.getScamInfo(tx);

    // Assert.
    expect(result).toBeUndefined();
    expect(potentialScamTransactionChecker.check).toHaveBeenCalled();
    expect(cachingService.getOrSetCache).toHaveBeenCalled();
    expect(extrasApiService.checkScamTransaction).toHaveBeenCalled();
  });

  it('scam transaction result type is none - returns null', async () => {
    // Arrange.
    const tx = new TransactionDetailed();
    jest.spyOn(potentialScamTransactionChecker, 'check').mockImplementation(() => true);
    const extrasApiScamTransactionResult = new TransactionScamResult();
    extrasApiScamTransactionResult.type = TransactionScamType.none;
    jest.spyOn(extrasApiService, 'checkScamTransaction').mockImplementation(() => Promise.resolve(extrasApiScamTransactionResult));
    jest.spyOn(cachingService, 'getOrSetCache').mockImplementation(() => extrasApiService.checkScamTransaction(new TransactionScamMinInfo()));

    // Act.
    const result = await transactionScamCheckService.getScamInfo(tx);

    // Assert.
    expect(result).toBeUndefined();
    expect(potentialScamTransactionChecker.check).toHaveBeenCalled();
    expect(cachingService.getOrSetCache).toHaveBeenCalled();
    expect(extrasApiService.checkScamTransaction).toHaveBeenCalled();
  });

  it('scam transaction result type is scam - returns scam', async () => {
    // Arrange.
    const tx = new TransactionDetailed();
    jest.spyOn(potentialScamTransactionChecker, 'check').mockImplementation(() => true);
    const extrasApiScamTransactionResult = new TransactionScamResult();
    extrasApiScamTransactionResult.type = TransactionScamType.scam;
    extrasApiScamTransactionResult.info = 'Scam report';
    jest.spyOn(extrasApiService, 'checkScamTransaction').mockImplementation(() => Promise.resolve(extrasApiScamTransactionResult));
    jest.spyOn(cachingService, 'getOrSetCache').mockImplementation(() => extrasApiService.checkScamTransaction(new TransactionScamMinInfo()));

    // Act.
    const result = await transactionScamCheckService.getScamInfo(tx);

    // Assert.
    expect(result).not.toBeUndefined();
    expect(result).not.toBeNull();
    expect(result?.type).toEqual(TransactionScamType.scam);
    expect(result?.info).toEqual('Scam report');
    expect(potentialScamTransactionChecker.check).toHaveBeenCalled();
    expect(cachingService.getOrSetCache).toHaveBeenCalled();
    expect(extrasApiService.checkScamTransaction).toHaveBeenCalled();
  });

  it('scam transaction result type is potentialScam - returns potentialScam', async () => {
    // Arrange.
    const tx = new TransactionDetailed();
    jest.spyOn(potentialScamTransactionChecker, 'check').mockImplementation(() => true);
    const extrasApiScamTransactionResult = new TransactionScamResult();
    extrasApiScamTransactionResult.type = TransactionScamType.potentialScam;
    extrasApiScamTransactionResult.info = 'Potential scam report';
    jest.spyOn(extrasApiService, 'checkScamTransaction').mockImplementation(() => Promise.resolve(extrasApiScamTransactionResult));
    jest.spyOn(cachingService, 'getOrSetCache').mockImplementation(() => extrasApiService.checkScamTransaction(new TransactionScamMinInfo()));

    // Act.
    const result = await transactionScamCheckService.getScamInfo(tx);

    // Assert.
    expect(result).not.toBeUndefined();
    expect(result).not.toBeNull();
    expect(result?.type).toEqual(TransactionScamType.potentialScam);
    expect(result?.info).toEqual('Potential scam report');
    expect(potentialScamTransactionChecker.check).toHaveBeenCalled();
    expect(cachingService.getOrSetCache).toHaveBeenCalled();
    expect(extrasApiService.checkScamTransaction).toHaveBeenCalled();
  });
});
