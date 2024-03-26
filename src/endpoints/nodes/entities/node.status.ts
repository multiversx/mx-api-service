import { registerEnumType } from "@nestjs/graphql";

export enum NodeStatus {
  new = 'new',
  unknown = 'unknown',
  waiting = 'waiting',
  eligible = 'eligible',
  jailed = 'jailed',
  queued = 'queued',
  leaving = 'leaving',
  inactive = 'inactive',
  auction = 'auction'
}

export enum NodeStatusRaw {
  staked = 'staked',
  jailed = 'jailed',
  queued = 'queued',
  unStaked = 'unStaked',
  notStaked = 'notStaked'
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

registerEnumType(NodeStatusRaw, {
  name: 'NodeStatusRaw',
  description: 'Node status raw object type.',
  valuesMap: {
    staked: {
      description: 'Staked raw status.',
    },
    jailed: {
      description: 'Jailed raw status.',
    },
    queued: {
      description: 'Queued raw status.',
    },
    unStaked: {
      description: 'UnStaked raw status.',
    },
    notStaked: {
      description: 'NotStaked raw status.',
    },
  },
});
