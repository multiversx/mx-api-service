import { Constants } from "@elrondnetwork/nestjs-microservice-template";

export class CacheValue {
  value?: string;
  ttl: number = Constants.oneSecond() * 6;
}
