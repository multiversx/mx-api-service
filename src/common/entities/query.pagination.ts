export class QueryPagination {
  constructor(init?: Partial<QueryPagination>) {
    Object.assign(this, init);
  }

  from: number = 0;
  size: number = 25;
}
