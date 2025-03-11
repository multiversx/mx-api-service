import { gql } from "graphql-request";

export const settingsQuery = (pairLimitCount: number) => gql`
query {
  filteredPairs(pagination: {first: ${pairLimitCount}}, filters: {state: ["Active"]}) {
    edges {
      node {
        address
      }
    }
  }
  proxy {
    address
    lockedAssetTokens {
      collection
    }
  }
  farms {
    ... on FarmModelV1_2 {
      state
      address
    }
    ... on FarmModelV1_3 {
      state
      address
    }
    ... on FarmModelV2 {
      state
      address
    }
  }
  wrappingInfo {
    address
    wrappedToken {
      identifier
    }
  }
  distribution {
    address
  }
  lockedAssetFactory {
    address
  }
  stakingFarms {
    state
    address
  }
  stakingProxies {
    address
  }
  factory {
    address
  }
  simpleLockEnergy {
    baseAssetToken {
      identifier
    }
  }
}
`;
