import { Resolver, Query } from "@nestjs/graphql";
import { NetworkService } from "src/endpoints/network/network.service";
import { NetworkConstants } from "src/endpoints/network/entities/constants";
import { Economics } from "src/endpoints/network/entities/economics";
import { Stats } from "src/endpoints/network/entities/stats";
import { About } from "src/endpoints/network/entities/about";

@Resolver()
export class NetworkQuery {
  constructor(protected readonly networkService: NetworkService) { }

  @Query(() => NetworkConstants, { name: "constants", description: "Retrieve network-specific constants that can be used to automatically configure dapps." })
  public async getConstants(): Promise<NetworkConstants> {
    return await this.networkService.getConstants();
  }

  @Query(() => Economics, { name: "economics", description: "Retrieve general economics information." })
  public async getEconomics(): Promise<Economics> {
    return await this.networkService.getEconomics();
  }

  @Query(() => Stats, { name: "stats", description: "Retrieve general network statistics." })
  public async getStats(): Promise<Stats> {
    return await this.networkService.getStats();
  }

  @Query(() => About, { name: "about", description: "Retrieve general information about API deployment." })
  public async getAbout(): Promise<About> {
    return await this.networkService.getAbout();
  }
}
