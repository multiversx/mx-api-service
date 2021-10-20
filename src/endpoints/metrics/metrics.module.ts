import { forwardRef, Module } from "@nestjs/common";
import { CommonModule } from "src/common/common.module";
import { MetricsService } from "./metrics.service";

@Module({
  imports: [
    forwardRef(() => CommonModule),
  ],
  providers: [
    MetricsService,
  ],
  exports: [
    MetricsService,
  ]
})
export class MetricsModule { }