import { ParseHashPipe } from "./parse.hash.pipe";

export class ParseBlockHashPipe extends ParseHashPipe {
  constructor() {
    super('block', 64);
  }
}
