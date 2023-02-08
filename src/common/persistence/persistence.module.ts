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
import { UserDbService } from "./services/user.db.service";
import { TransactionDbService } from "./services/transactiondb.service";
import { TransactionDb } from "./entities/transaction.db";
import { UserDb } from "./entities/user.db";

@Global()
@Module({})
export class PersistenceModule {
  static forRoot(): DynamicModule {

    const isPassThrough = process.env.PERSISTENCE === 'passthrough' || configuration().database?.enabled === false;
    if (isPassThrough) {
      return {
        module: PersistenceModule,
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
          {
            provide: getRepositoryToken(TransactionDb),
            useValue: {},
          },
          {
            provide: getRepositoryToken(UserDb),
            useValue: {},
          },
          PersistenceService, TransactionDbService, UserDbService,
        ],
        exports: [PersistenceService, TransactionDbService, UserDbService],
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
              entities: [NftMetadataDb, NftMediaDb, NftTraitSummaryDb, KeybaseConfirmationDb, HotSwappableSettingDb, UserDb, TransactionDb],
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
        TypeOrmModule.forFeature([NftMetadataDb, NftMediaDb, NftTraitSummaryDb, KeybaseConfirmationDb, HotSwappableSettingDb, UserDb, TransactionDb]),
      ],
      providers: [PersistenceService, TransactionDbService, UserDbService],
      exports: [PersistenceService, TypeOrmModule.forFeature([NftMetadataDb, NftMediaDb, NftTraitSummaryDb, KeybaseConfirmationDb, HotSwappableSettingDb, UserDb, TransactionDb]), UserDbService, TransactionDbService],
    };
  }
}

