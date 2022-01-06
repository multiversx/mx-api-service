import { Module } from "@nestjs/common";
import { DatabaseModule } from "./database/database.module";
import { DatabaseService } from "./database/database.service";
import { PassThroughModule } from "./passthrough/pass.through.module";
import { PassThroughService } from "./passthrough/pass.through.service";

@Module({
  imports: [
    process.env.PERSISTENCE === 'passthrough' ? PassThroughModule : DatabaseModule,
  ],
  providers: [
    {
      provide: 'PersistenceService',
      useClass: process.env.PERSISTENCE === 'passthrough' ? PassThroughService : DatabaseService,
    },
  ],
  exports: ['PersistenceService'],    
})
export class PersistenceModule { }