import { ApolloDriver, ApolloDriverConfig } from "@nestjs/apollo";
import { DynamicModule, Module } from "@nestjs/common";
import { GraphQLModule } from "@nestjs/graphql";

import configuration from "config/configuration";

import { join } from "path";

import { AccountDetailedModule } from "src/graphql/entities/account.detailed/account.detailed.module";
import { AccountModule } from "src/graphql/entities/account/account.module";
import { NftModule } from "src/graphql/entities/nft/nft.module";
import { NftCollectionModule } from "src/graphql/entities/nft.collection/nft.collection.module";
import { SmartContractResultModule } from "src/graphql/entities/smart.contract.result/smart.contract.result.module";
import { TransactionDetailedModule } from "src/graphql/entities/transaction.detailed/transaction.detailed.module";
import { TransactionModule } from "src/graphql/entities/transaction/transaction.module";

@Module({})
export class GraphQlModule {
  static register(): DynamicModule {
    return {
      module: GraphQlModule,
      imports: !configuration().api?.graphql ? [] : [
        GraphQLModule.forRoot<ApolloDriverConfig>({
          autoSchemaFile: join(process.cwd(), "src/graphql/schema/schema.gql"),
          driver: ApolloDriver,
          sortSchema: true,
        }),
        AccountDetailedModule,
        AccountModule,
        NftModule,
        NftCollectionModule,
        SmartContractResultModule,
        TransactionDetailedModule,
        TransactionModule,
      ],
    };
  }
}
