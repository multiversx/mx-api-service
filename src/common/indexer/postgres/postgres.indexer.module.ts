import { Module } from "@nestjs/common";
import { TypeOrmModule, TypeOrmModuleOptions } from "@nestjs/typeorm";
import { ApiConfigModule } from "src/common/api-config/api.config.module";
import { ApiConfigService } from "src/common/api-config/api.config.service";
import { PostgresIndexerService } from "./postgres.indexer.service";
import { entities } from "./entities";
import { PostgresIndexerHelper } from "./postgres.indexer.helper";

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ApiConfigModule],
      useFactory: (apiConfigService: ApiConfigService) => {
        let replication = undefined;
        const slaves = apiConfigService.getIndexerSlaveConnections();
        if (slaves.length > 0) {
          replication = {
            master: {
              ...apiConfigService.getIndexerConnection(),
            },
            slaves: apiConfigService.getIndexerSlaveConnections(),
          };
        }

        const options: TypeOrmModuleOptions = {
          type: 'postgres',
          entities,
          ...apiConfigService.getIndexerConnection(),
          keepConnectionAlive: true,
          synchronize: false,
          retryAttempts: 300,
          ssl: true,
          extra: {
            connectionLimit: 4,
            ssl: {
              rejectUnauthorized: false,
            },
          },
          replication,
        };

        return options;
      },
      inject: [ApiConfigService],
    }),
    TypeOrmModule.forFeature(entities),
  ],
  providers: [PostgresIndexerService, PostgresIndexerHelper],
  exports: [PostgresIndexerService, TypeOrmModule.forFeature(entities), PostgresIndexerHelper],
})
export class PostgresIndexerModule { }
