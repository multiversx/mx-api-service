import { ShardTransaction } from "@elrondnetwork/transaction-processor";

export abstract class TryGenericExtract {
  constructor(
    //@ts-ignore
    readonly transaction: ShardTransaction,
  ) { }
  abstract extract(): any;
}
