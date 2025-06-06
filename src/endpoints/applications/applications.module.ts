import { Module } from "@nestjs/common";
import { ApplicationsService } from "./applications.service";

@Module({
  providers: [
    ApplicationsService,
  ],
  exports: [
    ApplicationsService,
  ],
})
export class ApplicationsModule { }
