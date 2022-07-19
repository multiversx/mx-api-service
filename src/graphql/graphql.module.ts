import { ApolloDriver, ApolloDriverConfig } from "@nestjs/apollo";
import { Module } from "@nestjs/common";
import { GraphQLModule } from "@nestjs/graphql";

import { join } from "path";

import { AccountDetailedModule } from "src/graphql/entities/account.detailed/account.detailed.module";
import { AccountModule } from "src/graphql/entities/account/account.module";
import { SmartContractResultModule } from "src/graphql/entities/smart.contract.result/smart.contract.result.module";
import { TransactionDetailedModule } from "src/graphql/entities/transaction.detailed/transaction.detailed.module";
import { TransactionModule } from "src/graphql/entities/transaction/transaction.module";

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloDriverConfig>({
      autoSchemaFile: join(process.cwd(), "src/graphql/schema/schema.gql"),
      driver: ApolloDriver,
      sortSchema: true,
    }),
    AccountDetailedModule,
    AccountModule,
    SmartContractResultModule,
    TransactionDetailedModule,
    TransactionModule,
  ],
})
export class GraphQlModule {}
