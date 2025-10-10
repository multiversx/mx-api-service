import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { ApiConfigModule } from "src/common/api-config/api.config.module";
import { ApiConfigService } from "src/common/api-config/api.config.service";
import { AccountDetails, AccountDetailsSchema } from "./schemas";
import { AccountDetailsRepository } from "./repositories";
import { EventEmitterModule } from "@nestjs/event-emitter";
import configuration from "config/configuration";


const isPassThrough = process.env.PERSISTENCE === 'passthrough' || configuration()?.database?.enabled === false;

const mongoImports = isPassThrough ? [] : [
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
];

const mongoProviders = isPassThrough ? [
    {
        provide: AccountDetailsRepository,
        useValue: {
            getTokensForAddress: () => Promise.resolve([]),
            getTokenForAddress: () => Promise.resolve(undefined),
            getNftsForAddress: () => Promise.resolve([]),
            getNftForAddress: () => Promise.resolve(undefined),
            getAccount: () => Promise.resolve(null),
            updateAccount: () => Promise.resolve(null),
            updateAccounts: () => Promise.resolve([]),
        },
    },
] : [AccountDetailsRepository];

@Module({
    imports: mongoImports,
    providers: mongoProviders,
    exports: [AccountDetailsRepository],
})
export class MongoDbModule { }
