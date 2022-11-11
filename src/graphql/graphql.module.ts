import { ApolloDriver, ApolloDriverConfig } from "@nestjs/apollo";
import { DynamicModule, Module } from "@nestjs/common";
import { GraphQLModule } from "@nestjs/graphql";

import configuration from "config/configuration";

import { join } from "path";
import { GraphQLServicesModule } from "./entities/graphql.services.module";

@Module({})
export class GraphQlModule {
  static register(): DynamicModule {
    const module: DynamicModule = {
      module: GraphQlModule,
      imports: [],
    };

    const isGraphqlActive = configuration().api?.graphql ?? false;
    if (isGraphqlActive) {
      module.imports = [
        GraphQLModule.forRoot<ApolloDriverConfig>({
          autoSchemaFile: join(process.cwd(), "src/graphql/schema/schema.gql"),
          driver: ApolloDriver,
          fieldResolverEnhancers: ["interceptors"],
          sortSchema: true,
        }),
        GraphQLServicesModule,
      ];
    }

    return module;
  }
}
