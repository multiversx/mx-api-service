import { QueryConditionOptions } from "@multiversx/sdk-nestjs";
import { SortOrder } from "src/common/entities/sort.order";
import { TransactionStatus } from "./transaction.status";
import { TransactionType } from "./transaction.type";

export class TransactionFilter {
  constructor(init?: Partial<TransactionFilter>) {
    Object.assign(this, init);
  }

  address?: string;
  sender?: string;
  senders?: string[] = [];
  receivers?: string[] = [];
  token?: string;
  function?: string;
  senderShard?: number;
  receiverShard?: number;
  miniBlockHash?: string;
  hashes?: string[];
  status?: TransactionStatus;
  before?: number;
  after?: number;
  condition?: QueryConditionOptions;
  order?: SortOrder;
  type?: TransactionType;
  tokens?: string[];
  senderOrReceiver?: string;
}
