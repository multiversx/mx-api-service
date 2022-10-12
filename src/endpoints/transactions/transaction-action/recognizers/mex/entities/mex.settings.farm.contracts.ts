export class MexSettingsFarmContracts {
  constructor(init?: Partial<MexSettingsFarmContracts>) {
    Object.assign(this, init);
  }

  egldMex: string = '';
  egldUsd: string = '';
  mex: string = '';
  exit: string = '';
}
