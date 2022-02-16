import { ParseHashPipe } from "./parse.hash.pipe";

export class ParseTransactionHashPipe extends ParseHashPipe {
  constructor() {
    super('transaction', 64);
  }
}
