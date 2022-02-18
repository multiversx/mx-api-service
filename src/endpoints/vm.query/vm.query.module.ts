import { Module } from "@nestjs/common";
import { CachingModule } from "src/common/caching/caching.module";
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
