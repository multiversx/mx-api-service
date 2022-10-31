import { registerEnumType } from "@nestjs/graphql";

export enum NodeSort {
  name = 'name',
  version = 'version',
  tempRating = 'tempRating',
  leaderSuccess = 'leaderSuccess',
  leaderFailure = 'leaderFailure',
  validatorSuccess = 'validatorSuccess',
  validatorFailure = 'validatorFailure',
  validatorIgnoredSignatures = 'validatorIgnoredSignatures',
  position = 'position',
  auctionPosition = 'auctionPosition',
  locked = 'locked',
}

registerEnumType(NodeSort, {
  name: 'NodeSort',
  description: 'Node Sort object.',
  valuesMap: {
    name: {
      description: 'Node name.',
    },
    version: {
      description: 'Node version.',
    },
    tempRating: {
      description: 'Node temp rating.',
    },
    leaderSuccess: {
      description: 'Node learder success.',
    },
    leaderFailure: {
      description: 'Node leader failure.',
    },
    validatorSuccess: {
      description: 'Node validator success.',
    },
    validatorFailure: {
      description: 'Node validator failure.',
    },
    validatorIgnoredSignatures: {
      description: 'Node validator ignored signatures.',
    },
    position: {
      description: 'Node position.',
    },
    auctionPosition: {
      description: 'Node auction position.',
    },
    locked: {
      description: 'Node locked.',
    },
  },
});
