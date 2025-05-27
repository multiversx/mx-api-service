export class ProofFilter {
  constructor(init?: Partial<ProofFilter>) {
    Object.assign(this, init);
  }

  hash?: string;
}
