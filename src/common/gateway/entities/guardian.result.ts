import { GuardianData } from "./guardian.data";

export class GuardianResult {
  constructor(init?: Partial<GuardianResult>) {
    Object.assign(this, init);
  }

  guardianData: GuardianData = new GuardianData();
}
