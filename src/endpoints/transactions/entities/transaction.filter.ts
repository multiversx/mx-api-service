import { QueryConditionOptions } from "@elrondnetwork/erdnest";
import { SortOrder } from "src/common/entities/sort.order";
import { TransactionStatus } from "./transaction.status";
import { TransactionType } from "./transaction.type";

export class TransactionFilter {
  constructor(init?: Partial<TransactionFilter>) {
    Object.assign(this, init);
  }

  address?: string;
  sender?: string;
  receiver?: string;
  receivers?: string[] = [];
  token?: string;
  function?: string;
  senderShard?: number;
  receiverShard?: number;
  miniBlockHash?: string;
  hashes?: string[];
  status?: TransactionStatus;
  search?: string;
  before?: number;
  after?: number;
  condition?: QueryConditionOptions;
  order?: SortOrder;
  type?: TransactionType;
  tokens?: string[];
}
