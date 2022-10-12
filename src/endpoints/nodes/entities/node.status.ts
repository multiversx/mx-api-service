import { registerEnumType } from "@nestjs/graphql";

export enum NodeStatus {
  new = 'new',
  unknown = 'unknown',
  waiting = 'waiting',
  eligible = 'eligible',
  jailed = 'jailed',
  queued = 'queued',
  leaving = 'leaving',
  inactive = 'inactive'
}

registerEnumType(NodeStatus, {
  name: 'NodeStatus',
  description: 'Node status object type.',
  valuesMap: {
    new: {
      description: 'New status.',
    },
    unknown: {
      description: 'Unknown status.',
    },
    waiting: {
      description: 'Waiting status.',
    },
    eligible: {
      description: 'Eligible status.',
    },
    jailed: {
      description: 'Jailed status.',
    },
    queued: {
      description: 'Queued status.',
    },
    leaving: {
      description: 'Leaving status.',
    },
    inactive: {
      description: 'Inactive status.',
    },
  },
});
