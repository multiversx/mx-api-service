export class MexSettingsPairContracts {
  constructor(init?: Partial<MexSettingsPairContracts>) {
    Object.assign(this, init);
  }

  egldMex: string = '';
  egldUsd: string = '';
}
