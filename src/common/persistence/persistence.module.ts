import { Global, Module } from "@nestjs/common";
import { TypeOrmModule, TypeOrmModuleOptions } from "@nestjs/typeorm";
import { ApiConfigModule } from "../api-config/api.config.module";
import { ApiConfigService } from "../api-config/api.config.service";
import { NftMediaDb } from "./entities/nft.media.db";
import { NftMetadataDb } from "./entities/nft.metadata.db";
import { NftTraitSummaryDb } from "./entities/nft.trait.summary.db";
import { PersistenceService } from "./persistence.service";

@Global()
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ApiConfigModule],
      useFactory: (apiConfigService: ApiConfigService) => {
        const options: TypeOrmModuleOptions = {
          type: 'mongodb',
          entities: [NftMetadataDb, NftMediaDb, NftTraitSummaryDb],
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
    TypeOrmModule.forFeature([NftMetadataDb, NftMediaDb, NftTraitSummaryDb]),
  ],
  providers: [PersistenceService],
  exports: [PersistenceService, TypeOrmModule.forFeature([NftMetadataDb, NftMediaDb, NftTraitSummaryDb])],
})
export class PersistenceModule { }
