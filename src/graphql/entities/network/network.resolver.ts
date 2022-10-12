import { Resolver } from "@nestjs/graphql";
import { About } from "src/endpoints/network/entities/about";
import { NetworkConstants } from "src/endpoints/network/entities/constants";
import { Economics } from "src/endpoints/network/entities/economics";
import { Stats } from "src/endpoints/network/entities/stats";
import { NetworkService } from "src/endpoints/network/network.service";
import { NetworkQuery } from "./network.query";

@Resolver(() => NetworkConstants)
export class ConstantsResolver extends NetworkQuery {
  constructor(networkService: NetworkService) {
    super(networkService);
  }
}

@Resolver(() => Economics)
export class EconomicsResolver extends NetworkQuery {
  constructor(networkService: NetworkService) {
    super(networkService);
  }
}

@Resolver(() => Stats)
export class StatsResolver extends NetworkQuery {
  constructor(networkService: NetworkService) {
    super(networkService);
  }
}

@Resolver(() => About)
export class AboutResolver extends NetworkQuery {
  constructor(networkService: NetworkService) {
    super(networkService);
  }
}
