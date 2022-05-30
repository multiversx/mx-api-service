import { SortOrder } from "src/common/entities/sort.order";
import { TokenSort } from "./token.sort";

export class TokenFilter {
  search?: string;

  name?: string;

  identifier?: string;

  identifiers?: string[];

  sort?: TokenSort;

  order?: SortOrder;
}
