import { TransactionCustomSubscribePayload } from 'src/endpoints/transactions/entities/dtos/transaction.custom.subscribe';

export class RoomKeyGenerator {
  public static generate(
    prefix: string,
    data: Record<string, any>,
    dtoClass: Function,
  ): string[] {
    // get allowed keys from DTO (with caching)
    const allowedKeys = this.getKeys(dtoClass);

    // extract only key-value pairs that exist in the data and are non-null
    const activeFilters: { key: string; value: any }[] = [];

    for (const key of allowedKeys) {
      const value = data[key];
      // Ignore null, undefined, and empty strings
      if (value !== undefined && value !== null && value !== '') {
        activeFilters.push({ key, value });
      }
    }

    if (activeFilters.length === 0) {
      return [];
    }

    const rooms: string[] = [];
    const subsetCount = 1 << activeFilters.length; // 2^N combinations

    // Generate combinatorics
    // Start from 1 to ignore the empty set
    for (let i = 1; i < subsetCount; i++) {
      const currentSubset: Record<string, any> = {};

      for (let j = 0; j < activeFilters.length; j++) {
        // Check the bit to decide whether to include the element in the subset
        if ((i & (1 << j)) > 0) {
          const item = activeFilters[j];
          currentSubset[item.key] = item.value;
        }
      }

      rooms.push(`${prefix}${this.deterministicStringify(currentSubset)}`);
    }

    return rooms;
  }

  static deterministicStringify(obj: Record<string, any>): string {
    return JSON.stringify(
      Object.keys(obj)
        .sort()
        .reduce((result, key) => {
          result[key] = obj[key];
          return result;
        }, {} as Record<string, any>),
    );
  }

  private static getKeys(targetClass: Function): string[] {
    switch (targetClass) {
      case TransactionCustomSubscribePayload:
        return ['function', 'receiver', 'sender'];
      default:
        console.warn(`RoomKeyGenerator: No manual key mapping found for class ${targetClass.name}`);
        return []
    }
  }
}
