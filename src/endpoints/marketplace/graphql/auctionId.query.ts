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
          creationDate
          endDate
          marketplace{key}
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
