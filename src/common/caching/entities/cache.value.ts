import { Constants } from "src/utils/constants";

export class CacheValue {
  value?: string;
  ttl: number = Constants.oneSecond() * 6;
}
