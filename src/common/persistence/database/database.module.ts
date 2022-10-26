import { Module } from "@nestjs/common";
import { TypeOrmModule, TypeOrmModuleOptions } from "@nestjs/typeorm";
import { NftMediaDb } from "src/common/persistence/database/entities/nft.media.db";
import { NftMetadataDb } from "src/common/persistence/database/entities/nft.metadata.db";
import { ApiConfigModule } from "../../api-config/api.config.module";
import { ApiConfigService } from "../../api-config/api.config.service";
import { DatabaseService } from "./database.service";
import { KeybaseConfirmationDb } from "./entities/keybase.confirmation.db";

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ApiConfigModule],
      useFactory: (apiConfigService: ApiConfigService) => {
        let replication = undefined;
        const slaves = apiConfigService.getDatabaseSlaveConnections();
        if (slaves.length > 0) {
          replication = {
            master: {
              ...apiConfigService.getDatabaseConnection(),
            },
            slaves: apiConfigService.getDatabaseSlaveConnections(),
          };
        }

        const options: TypeOrmModuleOptions = {
          type: 'mysql',
          entities: [NftMetadataDb, NftMediaDb, KeybaseConfirmationDb],
          ...apiConfigService.getDatabaseConnection(),
          keepConnectionAlive: true,
          synchronize: true,
          retryAttempts: 300,
          extra: {
            connectionLimit: 4,
          },
          replication,
        };

        return options;
      },
      inject: [ApiConfigService],
    }),
    TypeOrmModule.forFeature([NftMetadataDb, NftMediaDb, KeybaseConfirmationDb]),
  ],
  providers: [DatabaseService],
  exports: [DatabaseService, TypeOrmModule.forFeature([NftMetadataDb, NftMediaDb, KeybaseConfirmationDb])],
})
export class DatabaseModule { }
