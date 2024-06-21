import { ParseArrayPipe, ParseIntPipe, ParseBlockHashPipe, ParseTransactionHashPipe, ParseAddressPipe, ParseBoolPipe } from "@multiversx/sdk-nestjs-common";
import { Controller, DefaultValuePipe, Get, NotFoundException, Param, Query } from "@nestjs/common";
import { ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from "@nestjs/swagger";
import { SmartContractResult } from "./entities/smart.contract.result";
import { SmartContractResultService } from "./scresult.service";
import { QueryPagination } from "src/common/entities/query.pagination";
import { SmartContractResultFilter } from "./entities/smart.contract.result.filter";
import { ParseArrayPipeOptions } from "@multiversx/sdk-nestjs-common/lib/pipes/entities/parse.array.options";
import { SmartContractResultOptions } from "./entities/smart.contract.result.options";

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
  @ApiQuery({ name: 'sender', description: 'Sender address', required: false })
  @ApiQuery({ name: 'receiver', description: 'Receiver address', required: false })
  @ApiQuery({ name: 'function', description: 'Filter results by function name', required: false })
  @ApiQuery({ name: 'withActionTransferValue', description: 'Returns value in USD and EGLD for transferred tokens within the action attribute', required: false })
  @ApiOkResponse({ type: [SmartContractResult] })
  getScResults(
    @Query('from', new DefaultValuePipe(0), ParseIntPipe) from: number,
    @Query('size', new DefaultValuePipe(25), ParseIntPipe) size: number,
    @Query('miniBlockHash', ParseBlockHashPipe) miniBlockHash?: string,
    @Query('originalTxHashes', ParseArrayPipe, ParseTransactionHashPipe) originalTxHashes?: string[],
    @Query('sender', ParseAddressPipe) sender?: string,
    @Query('receiver', ParseAddressPipe) receiver?: string,
    @Query('function', new ParseArrayPipe(new ParseArrayPipeOptions({ allowEmptyString: true }))) functions?: string[],
    @Query('withActionTransferValue', ParseBoolPipe) withActionTransferValue?: boolean,
  ): Promise<SmartContractResult[]> {
    return this.scResultService.getScResults(
      new QueryPagination({ from, size }),
      new SmartContractResultFilter({ miniBlockHash, originalTxHashes, sender, receiver, functions }),
      new SmartContractResultOptions({ withActionTransferValue }),
    );
  }

  @Get("/results/count")
  @ApiOperation({ summary: 'Smart contracts count', description: 'Returns total number of smart contracts results' })
  @ApiOkResponse({ type: Number })
  @ApiQuery({ name: 'sender', description: 'Sender address', required: false })
  @ApiQuery({ name: 'receiver', description: 'Receiver address', required: false })
  @ApiQuery({ name: 'function', description: 'Filter results by function name', required: false })
  getScResultsCount(
    @Query('sender', ParseAddressPipe) sender?: string,
    @Query('receiver', ParseAddressPipe) receiver?: string,
    @Query('function', new ParseArrayPipe(new ParseArrayPipeOptions({ allowEmptyString: true }))) functions?: string[],
  ): Promise<number> {
    return this.scResultService.getScResultsCount(new SmartContractResultFilter({ sender, receiver, functions }));
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
