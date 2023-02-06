import { gql } from "graphql-request";
import { AuctionState } from "../entities/auction.state";

export const accountAuctionsQuery = (address: string, state: AuctionState) => {
  return gql`
  query{
    auctions(filters:{
      operator: AND,
      filters:[
        {
          field: "ownerAddress",
          op: EQ
          values: ["${address}"]
        },
        {
          field: "status",
          op: EQ
          values: ["${state}"]
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
          marketplace{
            key
          }
          owner{
            address
          }
          tags
          marketplaceAuctionId
          startDate
          __typename
        }
      }
    }
  }`;
};
