export class VmQueryRequest {
  scAddress: string = '';
  funcName: string = '';
  caller: string | undefined;
  value: string | undefined;
  args: string[] = [];
}
