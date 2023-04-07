import { DynamicModule, Global, Module } from "@nestjs/common";
import { getRepositoryToken, TypeOrmModule, TypeOrmModuleOptions } from "@nestjs/typeorm";
import configuration from "config/configuration";
import { ApiConfigModule } from "../api-config/api.config.module";
import { ApiConfigService } from "../api-config/api.config.service";
import { HotSwappableSettingDb } from "./entities/hot.swappable.setting";
import { KeybaseConfirmationDb } from "./entities/keybase.confirmation.db";
import { NftMediaDb } from "./entities/nft.media.db";
import { NftMetadataDb } from "./entities/nft.metadata.db";
import { NftTraitSummaryDb } from "./entities/nft.trait.summary.db";
import { PersistenceService } from "./persistence.service";

@Global()
@Module({})
export class PersistenceModule {
  static forRoot(): DynamicModule {

    const isPassThrough = process.env.PERSISTENCE === 'passthrough' || configuration().database?.enabled === false;
    if (isPassThrough) {
      return {
        module: PersistenceModule,
        imports: [],
        providers: [
          {
            provide: getRepositoryToken(NftMetadataDb),
            useValue: {},
          },
          {
            provide: getRepositoryToken(NftMediaDb),
            useValue: {},
          },
          {
            provide: getRepositoryToken(NftTraitSummaryDb),
            useValue: {},
          },
          {
            provide: getRepositoryToken(KeybaseConfirmationDb),
            useValue: {},
          },
          {
            provide: getRepositoryToken(HotSwappableSettingDb),
            useValue: {},
          },
          PersistenceService,
        ],
        exports: [PersistenceService],
      };
    }

    return {
      module: PersistenceModule,
      imports: [
        TypeOrmModule.forRootAsync({
          imports: [ApiConfigModule],
          useFactory: (apiConfigService: ApiConfigService) => {

            const options: TypeOrmModuleOptions = {
              type: 'mongodb',
              entities: [NftMetadataDb, NftMediaDb, NftTraitSummaryDb, KeybaseConfirmationDb, HotSwappableSettingDb],
              url: apiConfigService.getDatabaseUrl(),
              keepAlive: 120000,
              sslValidate: false,
              retryAttempts: 300,
              useUnifiedTopology: true,
              synchronize: true,
            };

            return options;
          },
          inject: [ApiConfigService],
        }),
        TypeOrmModule.forFeature([NftMetadataDb, NftMediaDb, NftTraitSummaryDb, KeybaseConfirmationDb, HotSwappableSettingDb]),
      ],
      providers: [PersistenceService],
      exports: [PersistenceService, TypeOrmModule.forFeature([NftMetadataDb, NftMediaDb, NftTraitSummaryDb, KeybaseConfirmationDb, HotSwappableSettingDb])],
    };
  }
}

