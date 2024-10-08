export class SmartContractResultOptions {
  constructor(init?: Partial<SmartContractResultOptions>) {
    Object.assign(this, init);
  }

  withActionTransferValue?: boolean;
}
