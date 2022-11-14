import { forwardRef, Module } from "@nestjs/common";
import { GraphQlModule } from "src/common/graphql/graphql.module";
import { NftMarketplaceService } from "./marketplace.service";

@Module({
  imports: [
    forwardRef(() => GraphQlModule),
  ],
  providers: [
    NftMarketplaceService,
  ],
  exports: [
    NftMarketplaceService,
  ],
})
export class MarketplaceModule { }
