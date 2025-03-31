import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { ApiConfigModule } from "src/common/api-config/api.config.module";
import { ApiConfigService } from "src/common/api-config/api.config.service";
import { AccountDetails, AccountDetailsSchema } from "./schemas";
import { AccountDetailsRepository } from "./repositories";


@Module({
  imports: [
    MongooseModule.forRootAsync({
      imports: [ApiConfigModule],
      inject: [ApiConfigService],
      useFactory: (apiConfigService: ApiConfigService) => ({
        uri: apiConfigService.getDatabaseUrl(),
        tlsAllowInvalidCertificates: true,
      }),
    }),
    MongooseModule.forFeature([
      { name: AccountDetails.name, schema: AccountDetailsSchema },

    ]),
  ],
  providers: [
    AccountDetailsRepository,
  ],
  exports: [
    AccountDetailsRepository,
  ],
})
export class MongoDbModule { }
