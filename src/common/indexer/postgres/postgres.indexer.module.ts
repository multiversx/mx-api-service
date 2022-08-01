import { Module } from "@nestjs/common";
import { PostgresIndexerService } from "./postgres.indexer.service";

@Module({
  providers: [PostgresIndexerService],
  exports: [PostgresIndexerService],
})
export class PostgresIndexerModule { }
