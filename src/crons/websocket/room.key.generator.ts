import { EventsCustomSubscribePayload } from 'src/endpoints/events/entities/events.custom.subscribe';
import { TransactionCustomSubscribePayload } from 'src/endpoints/transactions/entities/dtos/transaction.custom.subscribe';
import { TransferCustomSubscribePayload } from 'src/endpoints/websocket/entities/transfers.custom.payload';

export class RoomKeyGenerator {
  public static generate(
    prefix: string,
    data: Record<string, any>,
    dtoClass: Function,
  ): string[] {
    const allowedKeys = this.getKeys(dtoClass);

    // extract only key-value pairs that exist in the data and are non-null
    const activeFilters: { key: string; value: any }[] = [];

    for (const key of allowedKeys) {
      if (key === 'token') {
        const value = data['value'];
        if (value != null && value !== '' && value !== '0') {
          activeFilters.push({ key: 'token', value: 'EGLD' });
        }
        const transfers = data?.action?.arguments?.transfers;
        if (Array.isArray(transfers)) {
          for (const transfer of transfers) {
            if (transfer.token) {
              activeFilters.push({ key: 'token', value: transfer.token });
            }
          }
        }
      } else {
        const value = data[key];
        // Ignore null, undefined, and empty strings
        if (value !== undefined && value !== null && value !== '') {
          activeFilters.push({ key, value });
        }
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
        return TransactionCustomSubscribePayload.getClassFields();
      case EventsCustomSubscribePayload:
        return EventsCustomSubscribePayload.getClassFields();
      case TransferCustomSubscribePayload:
        return TransferCustomSubscribePayload.getClassFields();
      default:
        console.warn(`RoomKeyGenerator: No manual key mapping found for class ${targetClass.name}`);
        return [];
    }
  }
}
