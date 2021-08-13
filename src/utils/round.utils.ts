export class RoundUtils {
  static roundToEpoch(round: number): number {
    return Math.floor(round / 14401);
  }
}