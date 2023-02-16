import { gql } from "graphql-request";
import { AuctionStatus } from "../entities/auction.status";

export const accountAuctionsQuery = (address: string, status?: AuctionStatus) => {
  return gql`
  query{
    auctions(filters:{
      operator: AND,
      filters:[
        {
          field: "ownerAddress",
          op: EQ,
          values: ["${address}"]
        }
        ${status
      ? `,{
          field: "status",
          op: EQ,
          values: ["${status}"]
        }`
      : ""
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
          minBid {
            amount
            token
          }
          maxBid {
            amount
            token
          }
          marketplaceAuctionId
          startDate
          __typename
        }
      }
    }
  }`;
};
