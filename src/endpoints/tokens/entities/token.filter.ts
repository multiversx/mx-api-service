import { SortOrder } from "src/common/entities/sort.order";
import { TokenType } from "src/common/indexer/entities";
import { TokenSort } from "./token.sort";

export class TokenFilter {
  constructor(init?: Partial<TokenFilter>) {
    Object.assign(this, init);
  }

  type?: TokenType;

  search?: string;

  name?: string;

  identifier?: string;

  identifiers?: string[];

  includeMetaESDT?: boolean;

  sort?: TokenSort;

  order?: SortOrder;
}
