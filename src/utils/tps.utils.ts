import { Constants } from "@multiversx/sdk-nestjs-common";
import { TpsFrequency } from "src/endpoints/tps/entities/tps.frequency";
import { TpsInterval } from "src/endpoints/tps/entities/tps.interval";

export class TpsUtils {
  static getTimestampByFrequency(timestamp: number, frequency: number): number {
    return Math.floor(timestamp / frequency) * frequency;
  }

  static Frequencies = [5, 30, 600];

  static getFrequencyByEnum(frequency: TpsFrequency): number {
    switch (frequency) {
      case TpsFrequency._5s:
        return 5;
      case TpsFrequency._30s:
        return 30;
      case TpsFrequency._10m:
        return 600;
      default:
        throw new Error('Invalid frequency');
    }
  }

  static getFrequencyByInterval(interval: TpsInterval): number {
    switch (interval) {
      case TpsInterval._10m:
        return 5;
      case TpsInterval._1h:
        return 30;
      case TpsInterval._1d:
        return 600;
      default:
        throw new Error('Invalid interval');
    }
  }

  static getIntervalByEnum(interval: TpsInterval): number {
    switch (interval) {
      case TpsInterval._10m:
        return Constants.oneMinute() * 10;
      case TpsInterval._1h:
        return Constants.oneHour();
      case TpsInterval._1d:
        return Constants.oneDay();
      default:
        throw new Error('Invalid interval');
    }
  }
}
