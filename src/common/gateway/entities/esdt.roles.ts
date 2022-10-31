export class EsdtAddressRoles {
  constructor(init?: Partial<EsdtAddressRoles>) {
    Object.assign(this, init);
  }
  roles!: { [key: string]: any };
}
