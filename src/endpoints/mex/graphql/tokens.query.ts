import { gql } from "graphql-request";

export const tokensQuery = gql`
 query tokens {
          tokens {
            identifier
            type
          }
        }`;
