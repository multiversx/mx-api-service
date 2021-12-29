import { Module } from "@nestjs/common";
import { DatabaseModule } from "./database/database.module";
import { DatabaseService } from "./database/database.service";

@Module({
  imports: [
    DatabaseModule,
  ],
  providers: [
    {
      provide: 'PersistenceService',
      useClass: DatabaseService
    },
  ],
  exports: ['PersistenceService'],
})
export class PersistenceModule { }