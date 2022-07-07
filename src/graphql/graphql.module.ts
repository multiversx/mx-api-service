import { ApolloDriver, ApolloDriverConfig } from "@nestjs/apollo";
import { Module } from "@nestjs/common";
import { GraphQLModule } from "@nestjs/graphql";

import { join } from "path";

import { AccountModule } from "src/graphql/account/account.module";

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloDriverConfig>({
      autoSchemaFile: join(process.cwd(), "src/graphql/schema/schema.gql"),
      driver: ApolloDriver,
      sortSchema: true,
    }),
    AccountModule,
  ],
})
export class GraphQlModule {}
