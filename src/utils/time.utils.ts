export class TimeUtils {
  static isTimestampInSeconds(input: number): boolean {
    return input < 100_000_000_000;
  }
}
