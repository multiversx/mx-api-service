import { DynamicModule, Global, Module, Type } from "@nestjs/common";
import configuration from "config/configuration";
import { MongoDbModule } from "./mongodb/mongo.db.module";
import { MongoDbService } from "./mongodb/mongo.db.service";
import { PassThroughModule } from "./passthrough/pass.through.module";
import { PassThroughService } from "./passthrough/pass.through.service";
import { PersistenceInterface } from "./persistence.interface";
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
