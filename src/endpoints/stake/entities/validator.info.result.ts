export class ValidatorInfoResult {
  constructor(init?: Partial<ValidatorInfoResult>) {
    Object.assign(this, init);
  }

  totalValidators: number = 0;

  activeValidators: number = 0;

  inactiveValidators: number = 0;

  queueSize: number | undefined = undefined;
}
