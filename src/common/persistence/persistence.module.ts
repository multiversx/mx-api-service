import { Global, Module } from "@nestjs/common";
import configuration from "config/configuration";
import { DatabaseModule } from "./database/database.module";
import { DatabaseService } from "./database/database.service";
import { PassThroughModule } from "./passthrough/pass.through.module";
import { PassThroughService } from "./passthrough/pass.through.service";

@Global()
@Module({
  imports: [
    process.env.PERSISTENCE === 'passthrough' ? PassThroughModule : DatabaseModule,
  ],
  providers: [
    {
      provide: 'PersistenceService',
      useClass: process.env.PERSISTENCE === 'passthrough' || configuration().database.enabled === false ? PassThroughService : DatabaseService,
    },
  ],
  exports: ['PersistenceService'],
})
export class PersistenceModule { }
