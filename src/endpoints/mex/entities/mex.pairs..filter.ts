import { MexPairExchange } from "./mex.pair.exchange";

export class MexPairsFilter {
  constructor(init?: Partial<MexPairsFilter>) {
    Object.assign(this, init);
  }
  exchange?: MexPairExchange;
  includeFarms?: boolean;
}
