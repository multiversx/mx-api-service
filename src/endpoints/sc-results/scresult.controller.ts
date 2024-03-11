import { ParseArrayPipe, ParseIntPipe, ParseBlockHashPipe, ParseTransactionHashPipe } from "@multiversx/sdk-nestjs-common";
import { Controller, DefaultValuePipe, Get, NotFoundException, Param, Query } from "@nestjs/common";
import { ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from "@nestjs/swagger";
import { SmartContractResult } from "./entities/smart.contract.result";
import { SmartContractResultService } from "./scresult.service";
import { QueryPagination } from "src/common/entities/query.pagination";
import { SmartContractResultFilter } from "./entities/smart.contract.result.filter";

@Controller()
@ApiTags('results')
export class SmartContractResultController {
  constructor(private readonly scResultService: SmartContractResultService) { }

  @Get("/results")
  @ApiOperation({ summary: 'Smart contract results', description: 'Returns all smart contract results available on the blockchain' })
  @ApiQuery({ name: 'from', description: 'Number of items to skip for the result set', required: false })
  @ApiQuery({ name: 'size', description: 'Number of items to retrieve', required: false })
  @ApiQuery({ name: 'miniBlockHash', description: 'The hash of the parent miniBlock', required: false })
  @ApiQuery({ name: 'originalTxHashes', description: 'Original transaction hashes', required: false })
  @ApiOkResponse({ type: [SmartContractResult] })
  getScResults(
    @Query('from', new DefaultValuePipe(0), ParseIntPipe) from: number,
    @Query('size', new DefaultValuePipe(25), ParseIntPipe) size: number,
    @Query('miniBlockHash', ParseBlockHashPipe) miniBlockHash?: string,
    @Query('originalTxHashes', ParseArrayPipe, ParseTransactionHashPipe) originalTxHashes?: string[],
  ): Promise<SmartContractResult[]> {
    return this.scResultService.getScResults(
      new QueryPagination({ from, size }),
      new SmartContractResultFilter({ miniBlockHash, originalTxHashes }));
  }

  @Get("/results/count")
  @ApiOperation({ summary: 'Smart contracts count', description: 'Returns total number of smart contracts results' })
  @ApiOkResponse({ type: Number })
  getScResultsCount(): Promise<number> {
    return this.scResultService.getScResultsCount();
  }

  @Get("/results/:scHash")
  @ApiOperation({ summary: 'Smart contract results details', description: 'Returns smart contract details for a given hash' })
  @ApiOkResponse({ type: SmartContractResult })
  @ApiNotFoundResponse({ description: 'Smart contract result not found' })
  async getScResult(@Param('scHash', ParseTransactionHashPipe) scHash: string): Promise<SmartContractResult> {
    const scResult = await this.scResultService.getScResult(scHash);
    if (!scResult) {
      throw new NotFoundException('Smart contract result not found');
    }

    return scResult;
  }
}
