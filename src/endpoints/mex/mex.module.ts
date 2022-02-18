import { Module } from "@nestjs/common";
import { MexService } from "./mex.service";

@Module({
  providers: [
    MexService,
  ],
  exports: [
    MexService,
  ],
})
export class MexModule { }
