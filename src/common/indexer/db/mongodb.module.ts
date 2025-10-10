import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { ApiConfigModule } from "src/common/api-config/api.config.module";
import { ApiConfigService } from "src/common/api-config/api.config.service";
import { AccountDetails, AccountDetailsSchema } from "./schemas";
import { AccountDetailsRepository } from "./repositories";
import { EventEmitterModule } from "@nestjs/event-emitter";


@Module({
    imports: [
        EventEmitterModule.forRoot({ maxListeners: 1 }),
        MongooseModule.forRootAsync({
            imports: [ApiConfigModule],
            inject: [ApiConfigService],
            useFactory: (apiConfigService: ApiConfigService) => ({
                uri: apiConfigService.getDatabaseUrl().replace(":27017", ''), // TODO: remove this hack
                tls: false,
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
