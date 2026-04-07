import { ElasticSortable } from "./elastic.sortable";

export interface Tag extends ElasticSortable {
  count: number;
  tag: string;
}
