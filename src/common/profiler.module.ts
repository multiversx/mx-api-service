import { Module } from "@nestjs/common";
import { ProfilerService } from "./profiler.service";


@Module({
  imports: [
  ],
  providers: [
    ProfilerService
  ],
  exports: [
    ProfilerService
  ]
})
export class ProfilerModule { }