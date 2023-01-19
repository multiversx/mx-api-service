import { Resolver } from "@nestjs/graphql";
import { Providers } from "src/endpoints/providers/entities/providers";
import { ProviderService } from "src/endpoints/providers/provider.service";
import { ProviderQuery } from "./providers.query";

@Resolver(() => Providers)
export class ProviderResolver extends ProviderQuery {
  constructor(providerService: ProviderService) {
    super(providerService);
  }
}
