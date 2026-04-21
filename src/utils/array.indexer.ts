/**
 * Utility class designed to provide O(1) lookups for arrays of objects.
 * It uses a WeakMap to cache the positions of elements based on a specific property.
 * The WeakMap ensures that once the array is garbage collected, its associated cache is also cleared, preventing memory leaks.
 */
export class ArrayIndexer {
  /**
   * The cache stores the array instance as the WeakMap key.
   * The value is an internal Map where:
   * - Key: The name of the property used for indexing (e.g., 'identifier').
   * - Value: A Record mapping the actual property values to their index in the array.
   */
  private static readonly cache = new WeakMap<any[], Map<string, Record<string, number>>>();

  /**
   * Retrieves or builds a dictionary (Record) of array indices based on a specified property.
   * * @param array The array instance to be indexed.
   * @param propertyNameForKey The property key of the objects inside the array used to build the index.
   * @returns A Record mapping the property values to their corresponding indices in the array.
   */
  static getOrSetPositions<T>(array: T[], propertyNameForKey: keyof T): Record<string, number> {
    const propertyString = String(propertyNameForKey);

    // 1. Check if we already have cache entries for this specific array instance
    let arrayRecords = this.cache.get(array);

    if (arrayRecords) {
      // 2. Check if we already computed the index Record for this specific property
      const cachedRecord = arrayRecords.get(propertyString);
      if (cachedRecord) {
        return cachedRecord; // Cache HIT: Return the existing index map
      }
    } else {
      // Initialize the internal Map for this new array instance
      arrayRecords = new Map<string, Record<string, number>>();
      this.cache.set(array, arrayRecords);
    }

    // 3. Cache MISS: Build the index Record by iterating through the array O(N)
    const record: Record<string, number> = {};

    for (let index = 0; index < array.length; index++) {
      const element = array[index];
      const key = String(element[propertyNameForKey]);

      // Map the property's stringified value to its position (index) in the array
      record[key] = index;
    }

    // 4. Save the newly built Record into the cache map for future use
    arrayRecords.set(propertyString, record);

    return record;
  }

  /**
   * Quickly retrieves an item from the array using the specified property and its value.
   * Leverages the cached index Record to perform an O(1) lookup.
   * * @param array The array to search in.
   * @param propertyNameForKey The property used for matching.
   * @param searchedKeyValue The exact value of the property to find.
   * @returns The found element, or undefined if it doesn't exist.
   */
  static getItemByKeyValue<T>(array: T[], propertyNameForKey: keyof T, searchedKeyValue: string | number): T | undefined {
    // Retrieve the cached index mapping for this array and property
    const index = this.getOrSetPositions(array, propertyNameForKey)[String(searchedKeyValue)];

    // If the index doesn't exist in our map, the item is not in the array
    if (index === undefined) {
      return undefined;
    }

    // Return the element directly from the array using the fast O(1) index lookup
    return array[index];
  }
}
