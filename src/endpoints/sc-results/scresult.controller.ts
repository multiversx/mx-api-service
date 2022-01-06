import { Controller, DefaultValuePipe, Get, NotFoundException, Param, ParseIntPipe, Query } from "@nestjs/common";
import { ApiQuery, ApiResponse, ApiTags } from "@nestjs/swagger";
import { ParseTransactionHashPipe } from "src/utils/pipes/parse.transaction.hash.pipe";
import { SmartContractResult } from "./entities/smart.contract.result";
import { SmartContractResultService } from "./scresult.service";

@Controller()
@ApiTags('sc-results')
export class SmartContractResultController {
  constructor(private readonly scResultService: SmartContractResultService) { }

  @ApiQuery({ name: 'from', description: 'Numer of items to skip for the result set', required: false })
  @ApiQuery({ name: 'size', description: 'Number of items to retrieve', required: false })
  @Get("/sc-results")
  @ApiResponse({
    status: 200,
    description: 'All smart contract results available on the blockchain',
    type: SmartContractResult,
  })
  getScResults(
    @Query('from', new DefaultValuePipe(0), ParseIntPipe) from: number,
    @Query('size', new DefaultValuePipe(25), ParseIntPipe) size: number,
  ): Promise<SmartContractResult[]> {
    return this.scResultService.getScResults({ from, size });
  }

  @Get("/sc-results/count")
  @ApiResponse({
    status: 200,
    description: 'The count of all smart contract results available on the blockchain',
    type: SmartContractResult,
  })
  getScResultsCount(): Promise<number> {
    return this.scResultService.getScResultsCount();
  }

  @Get("/sc-results/:scHash")
  @ApiResponse({
    status: 200,
    description: 'The specific smart contract result',
    type: SmartContractResult,
  })
  @ApiResponse({
    status: 404,
    description: 'Smart contract result not found',
  })
  async getScResult(@Param('scHash', ParseTransactionHashPipe) scHash: string): Promise<SmartContractResult> {
    const scResult = await this.scResultService.getScResult(scHash);
    if (!scResult) {
      throw new NotFoundException('Smart contract result not found');
    }

    return scResult;
  }
}