import { Body, Controller, HttpStatus, Post, Res } from "@nestjs/common";
import { ApiResponse, ApiTags } from "@nestjs/swagger";
import { VmQueryRequest } from "./entities/vm.query.request";
import { VmQueryService } from "./vm.query.service";
import { Response } from 'express';

@Controller()
@ApiTags('query')
export class VmQueryController {
  constructor(
    private readonly vmQueryService: VmQueryService
  ) {}

  @Post('/query')
  @ApiResponse({
    status: 201,
    description: 'Returns the result of the query',
  })
  async query(@Body() query: VmQueryRequest, @Res() res: Response) {
    let result: any;
    try {
      result = await this.vmQueryService.vmQueryFullResult(query.scAddress, query.FuncName, query.caller, query.args);
    } catch (error) {
      res.status(HttpStatus.BAD_REQUEST).json({statusCode: HttpStatus.BAD_REQUEST, code: error.response.data.code, message: error.response.data.error}).send();
      return;
    }

    let data = result.data.data;
    if (data.returnData !== null) {
      res.status(HttpStatus.OK).json(data);
    } else {
      res.status(HttpStatus.BAD_REQUEST).json({statusCode: HttpStatus.BAD_REQUEST, code: data.returnCode, message: data.returnMessage}).send();
    }
  }
} 