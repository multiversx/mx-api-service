import { Constants } from "@multiversx/sdk-nestjs";

export class CacheValue {
  value?: string;
  ttl: number = Constants.oneSecond() * 6;
}
