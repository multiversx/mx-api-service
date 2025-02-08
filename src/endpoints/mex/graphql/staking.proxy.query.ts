import { gql } from "graphql-request";

export const stakingProxyQuery = gql`
query StakingProxy {
  stakingProxies {
    address
    dualYieldToken {
      name
      collection
    }
  }
}`;
