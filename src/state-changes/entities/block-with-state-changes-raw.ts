import { StateAccessPerAccountRaw } from "./state-access-per-account-raw";

export class BlockWithStateChangesRaw {
  hash!: string;
  shardID!: number;
  nonce!: number;
  timestampMs!: number;
  stateAccessesPerAccounts!: Record<string, { stateAccess: StateAccessPerAccountRaw[] }>;

  constructor(init?: Partial<BlockWithStateChangesRaw>) {
    Object.assign(this, init);
  }
}
