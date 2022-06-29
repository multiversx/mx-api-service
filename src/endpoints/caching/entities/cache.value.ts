import { Constants } from "@elrondnetwork/nestjs-microservice-common";

export class CacheValue {
  value?: string;
  ttl: number = Constants.oneSecond() * 6;
}
