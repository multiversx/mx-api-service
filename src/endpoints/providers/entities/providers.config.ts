export class ProvidersConfig {
  constructor(init?: Partial<ProvidersConfig>) {
    Object.assign(this, init);
  }

  owner: string = '';
  serviceFee: number = 0;
  delegationCap: string = '';
  apr: number = 0;
}
