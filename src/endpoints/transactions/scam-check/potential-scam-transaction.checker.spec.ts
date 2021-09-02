import { SmartContractResult } from "../entities/smart.contract.result";
import { TransactionDetailed } from "../entities/transaction.detailed";
import { PotentialScamTransactionChecker } from "./potential-scam-transaction.checker";


describe('PotentialScamTransactionChecker', () => {
  let potentialScamTransactionChecker: PotentialScamTransactionChecker = new PotentialScamTransactionChecker();

  it('empty data, no SC results, both non SC addresses - returns false', async () => {
    // Arrange.
    const input: TransactionDetailed = new TransactionDetailed();
    input.data = '';
    input.sender = 'erd15ws5qefhx49n666qtksumyr4tcy6ynzzga8frq4zfazexd3xng0s4explm';
    input.receiver = 'erd1k7j6ewjsla4zsgv8v6f6fe3dvrkgv3d0d9jerczw45hzedhyed8sh2u34u';
    input.results = [];

    // Act.
    const result = await potentialScamTransactionChecker.check(input);

    // Assert.    
    expect(result).toBe(false);
  });

  it('data less than min, no SC results, both non SC addresses - returns false', async () => {
    // Arrange.
    const input: TransactionDetailed = new TransactionDetailed();
    input.data = 'a'.repeat(potentialScamTransactionChecker.minDataLength - 1);
    input.sender = 'erd15ws5qefhx49n666qtksumyr4tcy6ynzzga8frq4zfazexd3xng0s4explm';
    input.receiver = 'erd1k7j6ewjsla4zsgv8v6f6fe3dvrkgv3d0d9jerczw45hzedhyed8sh2u34u';
    input.results = [];

    // Act.
    const result = await potentialScamTransactionChecker.check(input);

    // Assert.    
    expect(result).toBe(false);
  });

  it('data equal to min, no SC results, both non SC addresses - returns true', async () => {
    // Arrange.
    const input: TransactionDetailed = new TransactionDetailed();
    input.data = 'a'.repeat(potentialScamTransactionChecker.minDataLength);
    input.sender = 'erd15ws5qefhx49n666qtksumyr4tcy6ynzzga8frq4zfazexd3xng0s4explm';
    input.receiver = 'erd1k7j6ewjsla4zsgv8v6f6fe3dvrkgv3d0d9jerczw45hzedhyed8sh2u34u';
    input.results = [];

    // Act.
    const result = await potentialScamTransactionChecker.check(input);

    // Assert.    
    expect(result).toBe(true);
  });

  it('data more than min, less than max, no SC results, both non SC addresses - returns true', async () => {
    // Arrange.
    const input: TransactionDetailed = new TransactionDetailed();
    input.data = 'a'.repeat(potentialScamTransactionChecker.minDataLength + 1);
    input.sender = 'erd15ws5qefhx49n666qtksumyr4tcy6ynzzga8frq4zfazexd3xng0s4explm';
    input.receiver = 'erd1k7j6ewjsla4zsgv8v6f6fe3dvrkgv3d0d9jerczw45hzedhyed8sh2u34u';
    input.results = [];

    // Act.
    const result = await potentialScamTransactionChecker.check(input);

    // Assert.    
    expect(result).toBe(true);
  });

  it('data more than min, less than max V2, no SC results, both non SC addresses - returns true', async () => {
    // Arrange.
    const input: TransactionDetailed = new TransactionDetailed();
    input.data = 'a'.repeat(potentialScamTransactionChecker.maxDataLength - 1);
    input.sender = 'erd15ws5qefhx49n666qtksumyr4tcy6ynzzga8frq4zfazexd3xng0s4explm';
    input.receiver = 'erd1k7j6ewjsla4zsgv8v6f6fe3dvrkgv3d0d9jerczw45hzedhyed8sh2u34u';
    input.results = [];

    // Act.
    const result = await potentialScamTransactionChecker.check(input);

    // Assert.    
    expect(result).toBe(true);
  });

  it('data equal to max, no SC results, both non SC addresses - returns true', async () => {
    // Arrange.
    const input: TransactionDetailed = new TransactionDetailed();
    input.data = 'a'.repeat(potentialScamTransactionChecker.maxDataLength);
    input.sender = 'erd15ws5qefhx49n666qtksumyr4tcy6ynzzga8frq4zfazexd3xng0s4explm';
    input.receiver = 'erd1k7j6ewjsla4zsgv8v6f6fe3dvrkgv3d0d9jerczw45hzedhyed8sh2u34u';
    input.results = [];

    // Act.
    const result = await potentialScamTransactionChecker.check(input);

    // Assert.    
    expect(result).toBe(true);
  });

  it('data more than max, no SC results, both non SC addresses - returns false', async () => {
    // Arrange.
    const input: TransactionDetailed = new TransactionDetailed();
    input.data = 'a'.repeat(potentialScamTransactionChecker.maxDataLength + 1);
    input.sender = 'erd15ws5qefhx49n666qtksumyr4tcy6ynzzga8frq4zfazexd3xng0s4explm';
    input.receiver = 'erd1k7j6ewjsla4zsgv8v6f6fe3dvrkgv3d0d9jerczw45hzedhyed8sh2u34u';
    input.results = [];

    // Act.
    const result = await potentialScamTransactionChecker.check(input);

    // Assert.    
    expect(result).toBe(false);
  });

  it('data more than max, no SC results, both non SC addresses - returns false', async () => {
    // Arrange.
    const input: TransactionDetailed = new TransactionDetailed();
    input.data = 'a'.repeat(potentialScamTransactionChecker.maxDataLength + 1);
    input.sender = 'erd15ws5qefhx49n666qtksumyr4tcy6ynzzga8frq4zfazexd3xng0s4explm';
    input.receiver = 'erd1k7j6ewjsla4zsgv8v6f6fe3dvrkgv3d0d9jerczw45hzedhyed8sh2u34u';
    input.results = [];

    // Act.
    const result = await potentialScamTransactionChecker.check(input);

    // Assert.    
    expect(result).toBe(false);
  });

  it('data between min and max, with SC results, both non SC addresses - returns false', async () => {
    // Arrange.
    const input: TransactionDetailed = new TransactionDetailed();
    input.data = 'a'.repeat(potentialScamTransactionChecker.minDataLength + 1);
    input.sender = 'erd15ws5qefhx49n666qtksumyr4tcy6ynzzga8frq4zfazexd3xng0s4explm';
    input.receiver = 'erd1k7j6ewjsla4zsgv8v6f6fe3dvrkgv3d0d9jerczw45hzedhyed8sh2u34u';
    input.results = [new SmartContractResult()];

    // Act.
    const result = await potentialScamTransactionChecker.check(input);

    // Assert.    
    expect(result).toBe(false);
  });

  it('data between min and max, no SC results, sender is SC - returns false', async () => {
    // Arrange.
    const input: TransactionDetailed = new TransactionDetailed();
    input.data = 'a'.repeat(potentialScamTransactionChecker.minDataLength + 1);
    input.sender = 'erd1qqqqqqqqqqqqqpgqy20dhf2t8dgpfuewhzncjl8vmsw59evv0n4sd3ntck';
    input.receiver = 'erd1k7j6ewjsla4zsgv8v6f6fe3dvrkgv3d0d9jerczw45hzedhyed8sh2u34u';
    input.results = [new SmartContractResult()];

    // Act.
    const result = await potentialScamTransactionChecker.check(input);

    // Assert.    
    expect(result).toBe(false);
  });

  it('data between min and max, no SC results, receiver is SC - returns false', async () => {
    // Arrange.
    const input: TransactionDetailed = new TransactionDetailed();
    input.data = 'a'.repeat(potentialScamTransactionChecker.minDataLength + 1);
    input.sender = 'erd1k7j6ewjsla4zsgv8v6f6fe3dvrkgv3d0d9jerczw45hzedhyed8sh2u34u';
    input.receiver = 'erd1qqqqqqqqqqqqqpgqy20dhf2t8dgpfuewhzncjl8vmsw59evv0n4sd3ntck';
    input.results = [new SmartContractResult()];

    // Act.
    const result = await potentialScamTransactionChecker.check(input);

    // Assert.    
    expect(result).toBe(false);
  });
});
