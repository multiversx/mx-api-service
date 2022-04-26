import { Controller, DefaultValuePipe, Get, NotFoundException, Param, ParseIntPipe, Query } from "@nestjs/common";
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from "@nestjs/swagger";
import { ParseTransactionHashPipe } from "src/utils/pipes/parse.transaction.hash.pipe";
import { SmartContractResult } from "./entities/smart.contract.result";
import { SmartContractResultService } from "./scresult.service";
import { ParseArrayPipe } from 'src/utils/pipes/parse.array.pipe';

@Controller()
@ApiTags('sc-results')
export class SmartContractResultController {
  constructor(private readonly scResultService: SmartContractResultService) { }

  @ApiQuery({ name: 'from', description: 'Numer of items to skip for the result set', required: false })
  @ApiQuery({ name: 'size', description: 'Number of items to retrieve', required: false })
  @ApiQuery({ name: 'miniBlockHash', description: 'The hash of the parent miniBlock', required: false })
  @Get("/sc-results")
  @ApiOperation({ summary: 'Smart contract results details', description: 'Returns smart contract results informations for a given transaction hashes' })
  @ApiResponse({
    status: 200,
    description: 'All smart contract results available on the blockchain',
    type: SmartContractResult,
  })
  getScResults(
    @Query('from', new DefaultValuePipe(0), ParseIntPipe) from: number,
    @Query('size', new DefaultValuePipe(25), ParseIntPipe) size: number,
    @Query('miniBlockHash') miniBlockHash?: string,
    @Query('originalTxHashes', new ParseArrayPipe(64)) originalTxHashes?: string[],
  ): Promise<SmartContractResult[]> {
    return this.scResultService.getScResults({ from, size }, { miniBlockHash, originalTxHashes });
  }

  @Get("/sc-results/count")
  @ApiOperation({ summary: 'Total smart contracts results', description: 'Returns total number of smart contracts results available on blockchain' })
  @ApiResponse({
    status: 200,
    description: 'The count of all smart contract results available on the blockchain',
    type: SmartContractResult,
  })
  getScResultsCount(): Promise<number> {
    return this.scResultService.getScResultsCount();
  }

  @Get("/sc-results/:scHash")
  @ApiOperation({ summary: 'Smart contract details', description: 'Returns smart contract informations for a given smart contract hash' })
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
