import { Module } from "@nestjs/common";
import { TpsService } from "./tps.service";


@Module({
  imports: [
  ],
  providers: [
    TpsService,
  ],
  exports: [
    TpsService,
  ],
})
export class TpsModule { }
