import { Constants } from "@elrondnetwork/erdnest";

export class CacheValue {
  value?: string;
  ttl: number = Constants.oneSecond() * 6;
}
