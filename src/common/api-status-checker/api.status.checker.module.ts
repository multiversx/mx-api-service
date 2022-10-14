import { MetricsModule } from "@elrondnetwork/erdnest";
import { Global, Module } from "@nestjs/common";
import { ApiStatusCheckerService } from "./api.status.checker.service";

@Global()
@Module({
  imports: [
    MetricsModule,
  ],
  providers: [
    ApiStatusCheckerService,
  ],
  exports: [
    ApiStatusCheckerService,
  ],
})
export class ApiStatusCheckerModule { }
