import { Module } from "@nestjs/common";
import { GraphQlService } from "./graphql.service";

@Module({
  providers: [
    GraphQlService,
  ],
  exports: [
    GraphQlService,
  ],
})
export class GraphQlModule { }
