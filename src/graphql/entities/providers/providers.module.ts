import { Module } from "@nestjs/common";
import { ProviderModule as InternalProviderModule } from "src/endpoints/providers/provider.module";
import { ProviderResolver } from "./providers.resolver";

@Module({
  imports: [InternalProviderModule],
  providers: [ProviderResolver],
})
export class ProviderModule { }
