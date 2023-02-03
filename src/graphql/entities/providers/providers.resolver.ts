import { Resolver } from "@nestjs/graphql";
import { Provider } from "src/endpoints/providers/entities/provider";
import { ProviderService } from "src/endpoints/providers/provider.service";
import { ProviderQuery } from "./providers.query";

@Resolver(() => Provider)
export class ProviderResolver extends ProviderQuery {
  constructor(providerService: ProviderService) {
    super(providerService);
  }
}
