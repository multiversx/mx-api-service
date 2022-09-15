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
import { TagModule } from "src/graphql/entities/tag/tag.module";
import { DelegationModule } from "src/graphql/entities/delegation/delegation.module";
import { DappConfigModule } from "src/graphql/entities/dapp.config/dapp.config.module";
import { WaitingListModule } from "src/graphql/entities/waiting.list/waiting.list.module";
import { UsernameModule } from "src/graphql/entities/username/username.module";
import { BlockModule } from "src/graphql/entities/block/block.module";
import { MiniBlockModule } from "src/graphql/entities/miniblock/mini.block.module";
import { NetworkModule } from "src/graphql/entities/network/network.module";
import { ShardModule } from "src/graphql/entities/shard/shard.module";
import { DelegationLegacyModule } from "src/graphql/entities/delegation-legacy/delegation-legacy.module";
import { IdentitiesModule } from "src/graphql/entities/identities/identities.module";
import { NodeModule } from "src/graphql/entities/nodes/nodes.module";
import { RoundModule } from "src/graphql/entities/rounds/rounds.module";

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
        AccountDetailedModule,
        AccountModule,
        NftModule,
        NftCollectionModule,
        SmartContractResultModule,
        TransactionDetailedModule,
        TransactionModule,
        TagModule,
        DelegationModule,
        DappConfigModule,
        WaitingListModule,
        UsernameModule,
        BlockModule,
        MiniBlockModule,
        NetworkModule,
        ShardModule,
        DelegationLegacyModule,
        IdentitiesModule,
        NodeModule,
        RoundModule,
      ];
    }

    return module;
  }
}
