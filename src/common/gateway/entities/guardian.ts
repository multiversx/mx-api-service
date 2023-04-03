export class Guardian {
  constructor(init?: Partial<Guardian>) {
    Object.assign(this, init);
  }

  activationEpoch?: number;
  address?: string;
  serviceUID?: string;
}
