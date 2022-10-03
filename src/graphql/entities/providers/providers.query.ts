import { Args, Query, Resolver } from "@nestjs/graphql";
import { ProviderService } from "src/endpoints/providers/provider.service";
import { Provider } from "src/endpoints/providers/entities/provider";
import { GetProviderByAddressInput, GetProviderInput } from "./providers.input";
import { ProviderFilter } from "src/endpoints/providers/entities/provider.filter";
import { NotFoundException } from "@nestjs/common";

@Resolver()
export class ProviderQuery {
  constructor(protected readonly providerService: ProviderService) { }

  @Query(() => [Provider], { name: "providers", description: "Retrieve all providers for the given input." })
  public async getProviders(@Args("input", { description: "Input to retrieve the given identity provider for." }) input: GetProviderInput): Promise<Provider[]> {
    return await this.providerService.getProviders(new ProviderFilter({
      identity: input.identity,
    }));
  }

  @Query(() => Provider, { name: "provider", description: "Retrieve a specific provider for the given input." })
  public async getProvider(@Args("input", { description: "Input to retrieve the given identity provider for." }) input: GetProviderByAddressInput): Promise<Provider | undefined> {
    const provider = await this.providerService.getProvider(GetProviderByAddressInput.resolve(input));

    if (!provider) {
      throw new NotFoundException('Provider not found');
    }

    return provider;
  }
}
