import { Body, Controller, HttpStatus, Post, Res } from "@nestjs/common";
import { ApiResponse, ApiTags } from "@nestjs/swagger";
import { VmQueryRequest } from "./entities/vm.query.request";
import { VmQueryService } from "./vm.query.service";
import { Response } from 'express';

@Controller()
@ApiTags('vm-values')
export class VmQueryController {
  constructor(
    private readonly vmQueryService: VmQueryService
  ) {}

  @Post('/vm-values/query')
  @ApiResponse({
    status: 201,
    description: 'Returns the result of the query',
  })
  async vmValuesQuery(@Body() query: VmQueryRequest, @Res() res: Response) {
    try {
      let result = await this.vmQueryService.vmQueryFullResult(query.scAddress, query.FuncName, query.caller, query.args);
      res.status(HttpStatus.OK).json(result).send();
    } catch (error) {
      res.status(HttpStatus.BAD_REQUEST).json(error.response.data).send();
    }
  }
}