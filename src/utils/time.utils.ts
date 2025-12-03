export class TimeUtils {
  static readonly TIMESTAMP_IN_SECONDS_THRESHOLD = 100_000_000_000;
  static isTimestampInSeconds(input: number): boolean {
    return input < TimeUtils.TIMESTAMP_IN_SECONDS_THRESHOLD;
  }
}
