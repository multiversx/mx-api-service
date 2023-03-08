import { gql } from "graphql-request";

export const auctionsCountQuery = gql`
query selectedAuction($filters: FiltersExpression) {
  auctions(
    filters: $filters
  ) {
    pageData {
      count
    }
  }
}`;
