import { UnlockMileStoneModel } from "./unlock-schedule";

export interface ILockedTokens {
  xmex: string | boolean,
  lkmex: string | boolean;
}

export interface IUnlockFields {
  unlockEpoch?: number,
  unlockSchedule?: UnlockMileStoneModel[];
}
