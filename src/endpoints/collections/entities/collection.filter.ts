import { ElasticQuery, QueryConditionOptions, QueryOperator, QueryType } from "@elrondnetwork/erdnest";
import { NftType } from "../../nfts/entities/nft.type";

export class CollectionFilter {
  constructor(init?: Partial<CollectionFilter>) {
    Object.assign(this, init);
  }

  collection?: string;
  identifiers?: string[];
  search?: string;
  type?: NftType[];
  owner?: string;
  before?: number;
  after?: number;
  canCreate?: boolean | string;
  canBurn?: boolean | string;
  canAddQuantity?: boolean | string;
  canUpdateAttributes?: boolean | string;
  canAddUri?: boolean | string;
  canTransferRole?: boolean | string;

  buildElasticQuery(address?: string, indexerV3Active: boolean = false): ElasticQuery {
    let elasticQuery = ElasticQuery.create();
    elasticQuery = elasticQuery.withMustNotExistCondition('identifier')
      .withMustMultiShouldCondition([NftType.MetaESDT, NftType.NonFungibleESDT, NftType.SemiFungibleESDT], type => QueryType.Match('type', type));

    if (address) {
      if (indexerV3Active) {
        elasticQuery = elasticQuery.withMustCondition(QueryType.Should(
          [
            QueryType.Match('currentOwner', address),
            QueryType.Nested('roles', { 'roles.ESDTRoleNFTCreate': address }),
            QueryType.Nested('roles', { 'roles.ESDTRoleNFTBurn': address }),
            QueryType.Nested('roles', { 'roles.ESDTRoleNFTAddQuantity': address }),
            QueryType.Nested('roles', { 'roles.ESDTRoleNFTUpdateAttributes': address }),
            QueryType.Nested('roles', { 'roles.ESDTRoleNFTAddURI': address }),
            QueryType.Nested('roles', { 'roles.ESDTTransferRole': address }),
          ]
        ));
      } else {
        elasticQuery = elasticQuery.withMustCondition(QueryType.Match('currentOwner', address));
      }
    }

    if (this.before || this.after) {
      elasticQuery = elasticQuery.withDateRangeFilter('timestamp', this.before, this.after);
    }

    if (indexerV3Active) {
      if (this.canCreate !== undefined) {
        elasticQuery = this.getRoleCondition(elasticQuery, 'ESDTRoleNFTCreate', address, this.canCreate);
      }

      if (this.canBurn !== undefined) {
        elasticQuery = this.getRoleCondition(elasticQuery, 'ESDTRoleNFTBurn', address, this.canBurn);
      }

      if (this.canAddQuantity !== undefined) {
        elasticQuery = this.getRoleCondition(elasticQuery, 'ESDTRoleNFTAddQuantity', address, this.canAddQuantity);
      }

      if (this.canUpdateAttributes !== undefined) {
        elasticQuery = this.getRoleCondition(elasticQuery, 'ESDTRoleNFTUpdateAttributes', address, this.canUpdateAttributes);
      }

      if (this.canAddUri !== undefined) {
        elasticQuery = this.getRoleCondition(elasticQuery, 'ESDTRoleNFTAddURI', address, this.canAddUri);
      }

      if (this.canTransferRole !== undefined) {
        elasticQuery = this.getRoleCondition(elasticQuery, 'ESDTTransferRole', address, this.canTransferRole);
      }
    }

    return elasticQuery.withMustMatchCondition('token', this.collection, QueryOperator.AND)
      .withMustMultiShouldCondition(this.identifiers, identifier => QueryType.Match('token', identifier, QueryOperator.AND))
      .withSearchWildcardCondition(this.search, ['token', 'name'])
      .withMustMultiShouldCondition(this.type, type => QueryType.Match('type', type))
      .withMustMultiShouldCondition([NftType.SemiFungibleESDT, NftType.NonFungibleESDT, NftType.MetaESDT], type => QueryType.Match('type', type));
  }

  private getRoleCondition(query: ElasticQuery, name: string, address: string | undefined, value: string | boolean) {
    const condition = value === false ? QueryConditionOptions.mustNot : QueryConditionOptions.must;
    const targetAddress = typeof value === 'string' ? value : address;

    return query.withCondition(condition, QueryType.Nested('roles', { [`roles.${name}`]: targetAddress }));
  }
}
