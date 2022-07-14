export class About {
  constructor(init?: Partial<About>) {
    Object.assign(this, init);
  }

  appVersion: string = '';
  pluginsVersion: string | undefined = undefined;
  network: string = '';
  cluster: string = '';
  version: string = '';
}
