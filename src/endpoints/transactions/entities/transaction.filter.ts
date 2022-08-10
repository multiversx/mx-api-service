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
  private _receivers?: string[] = [];
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

  get receivers(): string[] | undefined {
    return this._receivers;
  }

  set receivers(value: string[] | undefined) {
    if (value) {
      if (!this._receivers) {
        this._receivers = value;
      }
      else {
        this._receivers = [...this._receivers, ...value];
      }
    }
  }

  set receiver(value: string | undefined) {
    if (value) {
      if (!this._receivers) {
        this._receivers = [];
      }

      this._receivers.push(value);
    }
  }
}
