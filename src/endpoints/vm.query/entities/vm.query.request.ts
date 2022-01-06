export class VmQueryRequest {
  scAddress: string = '';
  funcName: string = '';
  caller: string | undefined;
  args: string[] = [];
}