export class BatchUtils {
  static async batchGet<TIN, TOUT>(
    elements: TIN[],
    identifierFunc: (element: TIN) => string,
    funcs: {
      getter: (elements: TIN[]) => Promise<{ [key: string]: TOUT }>,
      setter?: (elements: { [key: string]: TOUT }) => Promise<void>
    }[],
    chunkSize: number,
  ): Promise<{ [key: string]: TOUT }> {

    let inputElements = elements;

    const toBeSavedBack: { [key: string]: TOUT }[] = [];
    const result: { [key: string]: TOUT } = {};

    for (const [index, func] of funcs.entries()) {
      const processLevelResult = await this.batchGetSimple(inputElements, identifierFunc, func.getter, chunkSize);

      inputElements = processLevelResult.remaining;
      toBeSavedBack.push(processLevelResult.found);

      for (let i = 0; i < index; i++) {
        for (const key of Object.keys(processLevelResult.found)) {
          toBeSavedBack[i][key] = processLevelResult.found[key];
        }
      }

      for (const key of Object.keys(processLevelResult.found)) {
        result[key] = processLevelResult.found[key];
      }
    }

    for (const [index, toBeSaved] of toBeSavedBack.slice(1).entries()) {
      const setter = funcs[index].setter;
      if (!setter) {
        continue;
      }

      const chunks = this.splitObjectIntoChunks(toBeSaved, chunkSize);
      for (const chunk of chunks) {
        await setter(chunk);
      }
    }

    return result;
  }

  static async batchGetSimple<TIN, TOUT>(
    elements: TIN[],
    identifierFunc: (element: TIN) => string,
    getter: (elements: TIN[]) => Promise<{ [key: string]: TOUT }>,
    chunkSize: number,
  ): Promise<{ found: { [key: string]: TOUT }, remaining: TIN[] }> {
    const found: { [key: string]: TOUT } = {};
    const remaining: TIN[] = [];

    const chunks = this.splitArrayIntoChunks(elements, chunkSize);

    for (const chunk of chunks) {
      const outputElements = await getter(chunk);
      for (const inputElement of chunk) {
        const identifier = identifierFunc(inputElement);
        const outputElement = outputElements[identifier];

        if (outputElement !== undefined) {
          found[identifier] = outputElement;
        } else {
          remaining.push(inputElement);
        }
      }
    }

    return { found, remaining };
  }

  static splitArrayIntoChunks<T>(elements: T[], chunkSize: number): T[][] {
    const chunks: T[][] = [];

    let remainingElements = elements;
    while (remainingElements.length > 0) {
      const chunk = remainingElements.slice(0, chunkSize);

      chunks.push(chunk);

      remainingElements = remainingElements.slice(chunkSize);
    }

    return chunks;
  }

  static splitObjectIntoChunks<T>(elements: { [key: string]: T }, chunkSize: number): { [key: string]: T }[] {
    const chunks: { [key: string]: T }[] = [];

    const keysChunks = this.splitArrayIntoChunks(Object.keys(elements), chunkSize);

    for (const keysChunk of keysChunks) {
      const chunk: { [key: string]: T } = {};

      for (const key of keysChunk) {
        chunk[key] = elements[key];
      }

      chunks.push(chunk);
    }

    return chunks;
  }
}
