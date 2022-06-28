export class VmQueryRequest {
  constructor(init?: Partial<VmQueryRequest>) {
    Object.assign(this, init);
  }

  scAddress: string = '';
  funcName: string = '';
  caller: string | undefined;
  args: string[] = [];
  value: string | undefined;
}
