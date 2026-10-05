export class SearchAfterUtils {
  // a searchAfter cursor marks a position in the elastic results, not the item itself, so when items are
  // reordered locally every position keeps its cursor and the last item still continues from the last elastic hit
  static sortKeepingSearchAfterPositions<T extends { searchAfter?: string }>(items: T[], sort: (items: T[]) => T[]): T[] {
    const searchAfters = items.map(item => item.searchAfter);

    const sortedItems = sort(items);

    for (const [index, item] of sortedItems.entries()) {
      item.searchAfter = searchAfters[index];
    }

    return sortedItems;
  }
}
