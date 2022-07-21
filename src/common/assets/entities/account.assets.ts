export class AccountAssets {
  constructor(init?: Partial<AccountAssets>) {
    Object.assign(this, init);
  }

  name: string = '';
  description: string = '';
  tags: string[] = [];
  proof: string | undefined = undefined;
  icon: string | undefined = undefined;
  iconPng: string | undefined = undefined;
  iconSvg: string | undefined = undefined;
}
