import { BadRequestException, Body, Controller, HttpStatus, Post } from "@nestjs/common";
import { ApiCreatedResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { VmQueryRequest } from "./entities/vm.query.request";
import { VmQueryService } from "./vm.query.service";

@Controller()
@ApiTags('query')
export class VmQueryController {
  constructor(
    private readonly vmQueryService: VmQueryService
  ) { }

  @Post('/query')
  @ApiOperation({ summary: 'VM query', description: 'Performs a vm query on a given smart contract and returns its results' })
  @ApiCreatedResponse()
  async query(@Body() query: VmQueryRequest) {
    let result: any;
    try {
      result = await this.vmQueryService.vmQueryFullResult(query.scAddress, query.funcName, query.caller, query.args, query.value);
    } catch (error: any) {
      throw new BadRequestException({
        statusCode: HttpStatus.BAD_REQUEST,
        code: error.response.data.code,
        message: error.response.data.error,
      });
    }

    const data = result.data.data;
    if (data.returnData !== null) {
      return data;
    } else {
      throw new BadRequestException({
        statusCode: HttpStatus.BAD_REQUEST,
        code: data.returnCode,
        message: data.returnMessage,
      });
    }
  }
} 
