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
    // Collect active filters based on allowed keys and provided data
    const activeFilters = this.collectActiveFilters(allowedKeys, data);

    if (activeFilters.length === 0) {
      return [];
    }

    // Generate all combinations of room keys based on active filters
    return this.buildRoomKeys(prefix, activeFilters);
  }

  private static collectActiveFilters(allowedKeys: string[], data: Record<string, any>) {
    const activeFilters: { key: string; value: any }[] = [];

    for (const key of allowedKeys) {
      if (key === 'token') {
        this.addTokenFilters(activeFilters, data);
        continue;
      }

      const value = data[key];
      if (this.isValidFilterValue(value)) {
        activeFilters.push({ key, value });
      }
    }

    return activeFilters;
  }

  private static addTokenFilters(activeFilters: { key: string; value: any }[], data: Record<string, any>) {
    const value = data['value'];
    if (this.isValidFilterValue(value) && value !== '0') {
      activeFilters.push({ key: 'token', value: 'EGLD' });
    }

    const transfers = data?.action?.arguments?.transfers;
    if (!Array.isArray(transfers)) {
      return;
    }

    for (const transfer of transfers) {
      if (this.isValidFilterValue(transfer?.token)) {
        activeFilters.push({ key: 'token', value: transfer.token });
      }
    }
  }

  private static isValidFilterValue(value: any) {
    return value !== undefined && value !== null && value !== '';
  }

  private static buildRoomKeys(prefix: string, activeFilters: { key: string; value: any }[]) {
    const rooms: string[] = [];
    const subsetCount = 1 << activeFilters.length; // 2^N combinations

    // Start from 1 to ignore the empty set
    for (let mask = 1; mask < subsetCount; mask++) {
      const currentSubset: Record<string, any> = {};
      let skipIteration = false;

      for (let bit = 0; bit < activeFilters.length; bit++) {
        // Check the bit to decide whether to include the element in the subset
        if ((mask & (1 << bit)) > 0) {
          if (currentSubset.hasOwnProperty(activeFilters[bit].key)) {
            skipIteration = true;
            continue; // Skip duplicate keys
          }
          const item = activeFilters[bit];
          currentSubset[item.key] = item.value;
        }
      }
      if (!skipIteration) {
        rooms.push(`${prefix}${this.deterministicStringify(currentSubset)}`);
      }
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
