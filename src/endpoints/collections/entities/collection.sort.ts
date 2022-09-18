import { ElasticSortOrder, ElasticSortProperty } from "@elrondnetwork/erdnest";
import { SortOrder } from "src/common/entities/sort.order";

export enum CollectionSort {
  timestamp = 'timestamp',
  name = 'name'
}

export class CollectionSortHelper {
  static getElasticSort(sort?: CollectionSort, order?: SortOrder): ElasticSortProperty {
    return {
      name: this.getName(sort),
      order: this.getOrder(sort, order),
    };
  }

  private static getName(sort?: CollectionSort): string {
    if (!sort) {
      return CollectionSort.timestamp.toString();
    }

    if (sort === CollectionSort.name) {
      return 'name.keyword';
    }

    return sort.toString();
  }

  private static getOrder(sort?: CollectionSort, order?: SortOrder): ElasticSortOrder {
    if (!order) {
      // default descending only for timestamp field, to remain backwards compatible
      if (!sort || sort === CollectionSort.timestamp) {
        return ElasticSortOrder.descending;
      }

      return ElasticSortOrder.ascending;
    }

    return order === SortOrder.asc ? ElasticSortOrder.ascending : ElasticSortOrder.descending;
  }
}
