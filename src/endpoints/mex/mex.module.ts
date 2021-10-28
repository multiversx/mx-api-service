import { forwardRef, Module } from "@nestjs/common";
import { CommonModule } from "src/common/common.module";
import { MexService } from "./mex.service";

@Module({
  imports: [
    forwardRef(() => CommonModule),
  ],
  providers: [
    MexService
  ],
  exports: [
    MexService
  ]
})
export class MexModule { }