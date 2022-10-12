import { SortOrder } from "src/common/entities/sort.order";
import { TokenSort } from "./token.sort";

export class TokenFilter {
  constructor(init?: Partial<TokenFilter>) {
    Object.assign(this, init);
  }

  search?: string;

  name?: string;

  identifier?: string;

  identifiers?: string[];

  sort?: TokenSort;

  order?: SortOrder;
}
