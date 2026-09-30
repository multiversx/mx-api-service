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
    const valuesByKey = new Map<string, any[]>();
    for (const { key, value } of activeFilters) {
      const values = valuesByKey.get(key) ?? [];
      if (!values.includes(value)) {
        values.push(value);
      }

      valuesByKey.set(key, values);
    }

    // a key can hold several values (e.g. one token per transfer) but a room uses at most one of them,
    // so combinations are built per key instead of per filter to keep this linear in the number of values
    let combinations: Record<string, any>[] = [{}];
    for (const [key, values] of valuesByKey) {
      const extended: Record<string, any>[] = [];
      for (const combination of combinations) {
        for (const value of values) {
          extended.push({ ...combination, [key]: value });
        }
      }

      combinations = combinations.concat(extended);
    }

    return combinations
      .slice(1)
      .map(combination => `${prefix}${this.deterministicStringify(combination)}`);
  }

  // Renaming a field can move it to a different position in the sorted key, so the key is
  // rebuilt from its parsed form instead of being patched in place.
  public static substitute(prefix: string, roomKey: string, from: string, to: string): string {
    const { [from]: value, ...rest } = JSON.parse(roomKey.slice(prefix.length));
    if (value === undefined) {
      return roomKey;
    }

    return `${prefix}${this.deterministicStringify({ ...rest, [to]: value })}`;
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
