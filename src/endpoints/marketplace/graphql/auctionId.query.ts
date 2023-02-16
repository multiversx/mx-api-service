import { gql } from "graphql-request";

export const auctionIdQuery = (id: number) => {
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
          minBid {
            amount
            token
          }
          maxBid {
            amount
            token
          }
          ownerAddress
          marketplaceAuctionId
          startDate
          __typename
        }
      }
    }
  }
`;
};
