export class MexSettingsToken {
  constructor(init?: Partial<MexSettingsToken>) {
    Object.assign(this, init);
  }

  wegld: string = '';
  mex: string = '';
  busd: string = '';
  egldMex: string = '';
  egldUsd: string = '';

  mexFarm: string = '';
  egldMexFarm: string = '';
  egldUsdFarm: string = '';
}
