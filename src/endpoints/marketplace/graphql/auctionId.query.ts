import { gql } from "graphql-request";

export const auctionId = (id: string) => {
  return gql`
  query {
    auctions(filters:{
      operator: AND,
      filters:[
        {
          field: "id",
          op: EQ,
          values: ["${id}"]
        }
      ]
    }){
      edges{
        node{
          id
          identifier
          collection
          status
          type
          creationDate
          endDate
          marketplace{key}
          asset{creatorAddress}
          ownerAddress
          tags
          marketplaceAuctionId
          startDate
          __typename
        }
      }
    }
  }
`;
};
