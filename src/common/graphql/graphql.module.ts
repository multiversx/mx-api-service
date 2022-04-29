import { Global, Module } from "@nestjs/common";
import { GraphQlService } from "./graphql.service";

@Global()
@Module({
  providers: [
    GraphQlService,
  ],
  exports: [
    GraphQlService,
  ],
})
export class GraphQlModule { }
