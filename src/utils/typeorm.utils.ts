export class TypeormUtils {
  static textToStringArrayTransformer = {
    to: (value: string[]): string => JSON.stringify(value),
    from: (value: string): string[] => JSON.parse(value),
  };

  static textToNumberArrayTransformer = {
    to: (value: number[]): string => JSON.stringify(value),
    from: (value: string): number[] => JSON.parse(value),
  };
}
