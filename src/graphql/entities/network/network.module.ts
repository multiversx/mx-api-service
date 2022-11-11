import { Module } from "@nestjs/common";
import { NetworkModule as InternalNetworkModule } from "src/endpoints/network/network.module";
import { ConstantsResolver } from "./network.resolver";
@Module({
  imports: [InternalNetworkModule],
  providers: [ConstantsResolver],
})
export class NetworkModule { }
