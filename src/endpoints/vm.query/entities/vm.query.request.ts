export class VmQueryRequest {
  scAddress: string = '';
  FuncName: string = '';
  caller: string | undefined;
  args: string[] = []
}