import { ElasticQuery, QueryConditionOptions, QueryType } from "@elrondnetwork/erdnest";
import { TokenType } from "src/common/indexer/entities";

export class TokenWithRolesFilter {
  constructor(init?: Partial<TokenWithRolesFilter>) {
    Object.assign(this, init);
  }

  identifier?: string;

  search?: string;

  owner?: string;

  canMint?: boolean;

  canBurn?: boolean;

  buildElasticQuery(address: string): ElasticQuery {
    let elasticQuery = ElasticQuery.create()
      .withMustNotExistCondition('identifier')
      .withMustCondition(QueryType.Should(
        [
          QueryType.Match('currentOwner', address),
          QueryType.Nested('roles', { 'roles.ESDTRoleLocalMint': address }),
          QueryType.Nested('roles', { 'roles.ESDTRoleLocalBurn': address }),
        ]
      ))
      .withMustMatchCondition('type', TokenType.FungibleESDT)
      .withMustMatchCondition('token', this.identifier)
      .withMustMatchCondition('currentOwner', this.owner);

    if (this.search) {
      elasticQuery = elasticQuery
        .withShouldCondition([
          QueryType.Wildcard('token', this.search),
          QueryType.Wildcard('name', this.search),
        ]);
    }

    if (this.canMint !== undefined) {
      const condition = this.canMint === true ? QueryConditionOptions.must : QueryConditionOptions.mustNot;
      elasticQuery = elasticQuery.withCondition(condition, QueryType.Nested('roles', { 'roles.ESDTRoleLocalMint': address }));
    }

    if (this.canBurn !== undefined) {
      const condition = this.canBurn === true ? QueryConditionOptions.must : QueryConditionOptions.mustNot;
      elasticQuery = elasticQuery.withCondition(condition, QueryType.Nested('roles', { 'roles.ESDTRoleLocalBurn': address }));
    }

    return elasticQuery;
  }
}
