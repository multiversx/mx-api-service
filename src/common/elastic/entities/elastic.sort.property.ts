import { ElasticSortOrder } from "./elastic.sort.order";

export class ElasticSortProperty {
  name: string = '';
  order: ElasticSortOrder | undefined = undefined;
}
