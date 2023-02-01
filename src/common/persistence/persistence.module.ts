import { Global, Module } from "@nestjs/common";
import { EventEmitterModule } from "@nestjs/event-emitter";
import { TypeOrmModule, TypeOrmModuleOptions } from "@nestjs/typeorm";
import { ApiConfigModule } from "../api-config/api.config.module";
import { ApiConfigService } from "../api-config/api.config.service";
import { HotSwappableSettingDb } from "./entities/hot.swappable.setting";
import { KeybaseConfirmationDb } from "./entities/keybase.confirmation.db";
import { NftMediaDb } from "./entities/nft.media.db";
import { NftMetadataDb } from "./entities/nft.metadata.db";
import { NftTraitSummaryDb } from "./entities/nft.trait.summary.db";
import { PersistenceService } from "./persistence.service";

@Global()
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ApiConfigModule, EventEmitterModule.forRoot()],
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
})
export class PersistenceModule { }
