import { gql } from "graphql-request";

export const pairCountQuery = gql`
query PairCount {
      factory {
        pairCount
      }
    }`;
