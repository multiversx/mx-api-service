import { Module, Provider } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { ApiConfigModule } from "src/common/api-config/api.config.module";
import { ApiConfigService } from "src/common/api-config/api.config.service";
import { AccountDetails, AccountDetailsSchema, EsdtDetails, EsdtDetailsSchema } from "./schemas";
import { AccountDetailsRepository, EsdtDetailsRepository } from "./repositories";
import { EventEmitterModule } from "@nestjs/event-emitter";
import configuration from "config/configuration";

const isPassThrough =
    process.env.PERSISTENCE === 'passthrough' ||
    configuration()?.database?.enabled === false;

const mongoImports = [];

if (!isPassThrough) {
    mongoImports.push(
        EventEmitterModule.forRoot({ maxListeners: 1 }),
        MongooseModule.forRootAsync({
            imports: [ApiConfigModule],
            inject: [ApiConfigService],
            useFactory: (apiConfigService: ApiConfigService) => ({
                uri: apiConfigService.getDatabaseUrl().replace(":27017", ''),
                tls: apiConfigService.isDatabaseTlsEnabled(),
                tlsAllowInvalidCertificates: true,
            }),
        }),
        MongooseModule.forFeature([
            { name: AccountDetails.name, schema: AccountDetailsSchema },
            { name: EsdtDetails.name, schema: EsdtDetailsSchema },
        ])
    );
}

const mongoProviders: Provider[] = [];

if (isPassThrough) {
    mongoProviders.push(
        {
            provide: AccountDetailsRepository,
            useValue: {
                getAccount: () => Promise.resolve(null),
                updateAccount: () => Promise.resolve(null),
                updateAccounts: () => Promise.resolve([]),
            },
        },
        {
            provide: EsdtDetailsRepository,
            useValue: {
                getEsdt: () => Promise.resolve(null),
                updateEsdts: () => Promise.resolve([]),
            },
        },
    );
} else {
    mongoProviders.push(
        { provide: AccountDetailsRepository, useClass: AccountDetailsRepository },
        { provide: EsdtDetailsRepository, useClass: EsdtDetailsRepository },
    );
}

@Module({
    imports: mongoImports,
    providers: mongoProviders,
    exports: mongoProviders,
})
export class MongoDbModule { }
