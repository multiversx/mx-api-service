export class SmartContractResultFilter {
  constructor(init?: Partial<SmartContractResultFilter>) {
    Object.assign(this, init);
  }

  miniBlockHash?: string;
  originalTxHashes?: string[];
}
