export class RecordUtils {
  static mapKeys<T>(obj: Record<string, T>, predicate: (key: string) => string): Record<string, T> {
    const result: Record<string, T> = {};

    for (const key of Object.keys(obj)) {
      const newKey = predicate(key);

      result[newKey] = obj[key];
    }

    return result;
  }
}
