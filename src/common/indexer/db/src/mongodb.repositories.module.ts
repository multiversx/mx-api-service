import { Global, Module, forwardRef } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { AccountDetails, AccountDetailsSchema } from "./schemas";
import { ApiMetricsModule } from "src/common/metrics/api.metrics.module";
import { AccountDetailsRepository } from "./repositories";


@Global()
@Module({
  imports: [
    forwardRef(() => ApiMetricsModule),
    MongooseModule.forFeature([
      { name: AccountDetails.name, schema: AccountDetailsSchema },
    ]),
  ],
  providers: [
    AccountDetailsRepository
  ],
  exports: [
    AccountDetailsRepository,
  ],
})
export class MongoDbRepositoriesModule { }
