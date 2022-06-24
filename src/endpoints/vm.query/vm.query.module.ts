import { CachingModule } from "@elrondnetwork/nestjs-microservice-template";
import { Module } from "@nestjs/common";
import { VmQueryService } from "./vm.query.service";

@Module({
  imports: [
    CachingModule,
  ],
  providers: [
    VmQueryService,
  ],
  exports: [
    VmQueryService,
  ],
})
export class VmQueryModule { }
