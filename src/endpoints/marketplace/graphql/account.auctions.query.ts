import { gql } from "graphql-request";
import { StatusAuction } from "../entities/auction.state.enum";

export const accountAuctionsQuery = (address: string, state: StatusAuction) => {
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
