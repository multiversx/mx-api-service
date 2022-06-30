import { QueryConditionOptions } from "@elrondnetwork/erdnest";
import { SortOrder } from "src/common/entities/sort.order";
import { TransactionStatus } from "./transaction.status";
import { TransactionType } from "./transaction.type";

export class TransactionFilter {
  address?: string;
  sender?: string;
  receiver?: string;
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
