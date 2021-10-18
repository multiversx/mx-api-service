import { forwardRef, Module } from "@nestjs/common";
import { CommonModule } from "src/common/common.module";
import { MetricsController } from "./metrics.controller";
import { MetricsService } from "./metrics.service";

@Module({
  imports: [
    forwardRef(() => CommonModule),
  ],
  controllers: [
    MetricsController,
  ],
  providers: [
    MetricsService,
  ],
  exports: [
    MetricsService,
  ]
})
export class MetricsModule { }