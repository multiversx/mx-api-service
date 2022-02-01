import { ParseHashPipe } from "./parse.hash.pipe";

export class ParseBlsHashPipe extends ParseHashPipe {
  constructor() {
    super('bls', 192);
  }
}
