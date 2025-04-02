export class ApplicationMostUsed {
  constructor(init?: Partial<ApplicationMostUsed>) {
    Object.assign(this, init);
  }

  address: string = '';
  transfers24H: number = 0;
}
