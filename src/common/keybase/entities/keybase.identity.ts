export class KeybaseIdentity {
  constructor(init?: Partial<KeybaseIdentity>) {
    Object.assign(this, init);
  }

  identity: string = '';
  name: string = '';
  description?: string = '';
  avatar?: string = '';
  twitter?: string = '';
  website?: string = '';
  location?: string = '';
}
