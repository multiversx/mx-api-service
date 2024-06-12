export class Tps {
  constructor(init?: Partial<Tps>) {
    Object.assign(this, init);
  }

  tps: number = 0;
  timestamp: number = 0;
}
