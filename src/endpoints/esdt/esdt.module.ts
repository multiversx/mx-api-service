import { forwardRef, Module } from "@nestjs/common";
import { MetricsModule } from "src/common/metrics/metrics.module";
import { VmQueryModule } from "src/endpoints/vm.query/vm.query.module";
import { ApiConfigModule } from "../../common/api-config/api.config.module";
import { BlsModule } from "../bls/bls.module";
import { CachingModule } from "../../common/caching/caching.module";
import { ElasticModule } from "../../common/elastic/elastic.module";
import { EsdtService } from "./esdt.service";
import { ExternalModule } from "../../common/external/external.module";
import { GatewayModule } from "../../common/gateway/gateway.module";
import { ProtocolModule } from "src/common/protocol/protocol.module";
import { TokenModule } from "../tokens/token.module";
import { EsdtAddressService } from "./esdt.address.service";
import { NftModule } from "../nfts/nft.module";
import { CollectionModule } from "../collections/collection.module";


@Module({
  imports: [
    ApiConfigModule, ExternalModule, CachingModule, BlsModule, ElasticModule, GatewayModule,
    NftModule,
    CollectionModule,
    forwardRef(() => TokenModule),
    forwardRef(() => GatewayModule),
    forwardRef(() => VmQueryModule),
    forwardRef(() => MetricsModule),
    ProtocolModule,
  ],
  providers: [
    EsdtService, EsdtAddressService,
  ],
  exports: [
    EsdtService, EsdtAddressService,
  ],
})
export class EsdtModule { }
