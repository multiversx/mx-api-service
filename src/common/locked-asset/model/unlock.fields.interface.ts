import { UnlockMileStoneModel } from "./unlock.milestone.model";

export interface UnlockFieldsInterface {
  unlockEpoch?: number,
  unlockSchedule?: UnlockMileStoneModel[];
}
