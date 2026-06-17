import { BadRequestException } from "@nestjs/common";

export class QueryPagination {
  constructor(init?: Partial<QueryPagination>) {
    Object.assign(this, init);

    if (this.searchAfter !== undefined && this.from !== 0) {
      throw new BadRequestException("'from' must be 0 when 'searchAfter' is provided.");
    }
  }

  from: number = 0;
  size: number = 25;

  before?: number;
  after?: number;
  searchAfter?: string;
}
