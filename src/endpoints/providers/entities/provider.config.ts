export class ProviderConfig {
  constructor(init?: Partial<ProviderConfig>) {
    Object.assign(this, init);
  }

  owner: string = '';
  serviceFee: number = 0;
  delegationCap: string = '';
  apr: number = 0;
}
