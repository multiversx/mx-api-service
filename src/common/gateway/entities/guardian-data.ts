export class ActiveGuardian {
  constructor(init?: Partial<ActiveGuardian>) {
    Object.assign(this, init);
  }

  activationEpoch?: number;
  address?: string;
  serviceUID?: string;
}

export class PendingGuardian {
  constructor(init?: Partial<PendingGuardian>) {
    Object.assign(this, init);
  }

  activationEpoch?: number;
  address?: string;
  serviceUID?: string;
}

export class GuardianData {
  constructor(init?: Partial<GuardianData>) {
    Object.assign(this, init);
  }

  activeGuardian?: ActiveGuardian;
  pendingGuardian?: PendingGuardian;
  guarded?: boolean;
}
