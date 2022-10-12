export class DelegationData {
  constructor(init?: Partial<DelegationData>) {
    Object.assign(this, init);
  }

  aprValue: number | undefined = undefined;
  featured: boolean = false;
  contract: string | null = null;
}
