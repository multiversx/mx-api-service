import { QueryConditionOptions } from "@multiversx/sdk-nestjs-elastic";
import { BadRequestException } from "@nestjs/common";
import { QueryPagination } from "src/common/entities/query.pagination";

export class RoundFilter extends QueryPagination {
  constructor(init?: Partial<RoundFilter>) {
    super();
    Object.assign(this, init);
    if (this.searchAfter !== undefined && this.from !== 0) {
      throw new BadRequestException("'from' must be 0 when 'searchAfter' is provided.");
    }
  }

  condition: QueryConditionOptions | undefined = QueryConditionOptions.must;
  validator: string | undefined;
  shard: number | undefined;
  epoch: number | undefined;
}
