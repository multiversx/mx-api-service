import { QueryConditionOptions } from "@multiversx/sdk-nestjs-elastic";
import { SortOrder } from "src/common/entities/sort.order";
import { TransactionStatus } from "./transaction.status";
import { TransactionType } from "./transaction.type";
import { BadRequestException } from "@nestjs/common";

export class TransactionFilter {
  constructor(init?: Partial<TransactionFilter>) {
    Object.assign(this, init);
  }

  address?: string;
  sender?: string;
  senders?: string[] = [];
  receivers?: string[] = [];
  token?: string;
  functions?: string[] = [];
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
  isRelayed?: boolean;
  relayer?: string;
  round?: number;
  withRelayedScresults?: boolean;

  validate(size: number) {
    if (this.withRelayedScresults && size > 50) {
      throw new BadRequestException('Size must be less than or equal to 50 when withRelayedScresults is set');
    }
  }
}
