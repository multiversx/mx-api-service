import { Constants } from "@elrondnetwork/erdnest-common";

export class CacheValue {
  value?: string;
  ttl: number = Constants.oneSecond() * 6;
}
