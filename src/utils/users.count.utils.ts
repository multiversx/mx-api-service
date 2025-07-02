import { Constants } from "@multiversx/sdk-nestjs-common";
import { UsersCountRange } from "src/endpoints/applications/entities/application.filter";

export class ApplicationMetricsUtils {
  static getSecondsForRange(range: UsersCountRange): number {
    switch (range) {
      case UsersCountRange._24h:
        return 24 * 60 * 60;
      case UsersCountRange._7d:
        return 7 * 24 * 60 * 60;
      case UsersCountRange._30d:
        return 30 * 24 * 60 * 60;
      case UsersCountRange._allTime:
        return 0;
      default:
        throw new Error('Invalid users count range');
    }
  }

  static getTTLForRange(range: UsersCountRange): number {
    switch (range) {
      case UsersCountRange._24h:
        return Constants.oneHour();
      case UsersCountRange._7d:
        return Constants.oneDay();
      case UsersCountRange._30d:
        return Constants.oneDay() * 2;
      case UsersCountRange._allTime:
        return Constants.oneDay() * 7;
      default:
        return Constants.oneHour();
    }
  }

  static getCronScheduleForRange(range: UsersCountRange): string {
    switch (range) {
      case UsersCountRange._24h:
        return '0 */30 * * * *';
      case UsersCountRange._7d:
        return '0 0 */6 * * *';
      case UsersCountRange._30d:
        return '0 0 */12 * * *';
      case UsersCountRange._allTime:
        return '0 0 0 * * *';
      default:
        return '0 */30 * * * *';
    }
  }

  static getAllRanges(): UsersCountRange[] {
    return [UsersCountRange._24h, UsersCountRange._7d, UsersCountRange._30d, UsersCountRange._allTime];
  }
}

export const UsersCountUtils = ApplicationMetricsUtils;
