import { Module } from "@nestjs/common";
import { TypeOrmModule, TypeOrmModuleOptions } from "@nestjs/typeorm";
import { ApiConfigModule } from "../../api-config/api.config.module";
import { ApiConfigService } from "../../api-config/api.config.service";
import { NftMediaDb } from "./entities/nft.media.db";
import { NftMetadataDb } from "./entities/nft.metadata.db";
import { MongoDbService } from "./mongo.db.service";

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ApiConfigModule],
      useFactory: (apiConfigService: ApiConfigService) => {
        const options: TypeOrmModuleOptions = {
          type: 'mongodb',
          entities: [NftMetadataDb, NftMediaDb],
          url: apiConfigService.getDatabaseUrl(),
          keepConnectionAlive: true,
          sslValidate: false,
          retryAttempts: 300,
          useUnifiedTopology: true,
          synchronize: true,
        };

        return options;
      },
      inject: [ApiConfigService],
    }),
    TypeOrmModule.forFeature([NftMetadataDb, NftMediaDb]),
  ],
  providers: [MongoDbService],
  exports: [MongoDbService, TypeOrmModule.forFeature([NftMetadataDb, NftMediaDb])],
})
export class MongoDbModule { }
