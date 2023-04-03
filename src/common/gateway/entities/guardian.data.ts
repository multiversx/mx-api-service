import { Guardian } from "./guardian";

export class GuardianData {
  constructor(init?: Partial<GuardianData>) {
    Object.assign(this, init);
  }

  activeGuardian?: Guardian;
  pendingGuardian?: Guardian;
  guarded?: boolean;
}
