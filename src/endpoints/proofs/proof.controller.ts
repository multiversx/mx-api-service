import { ParseIntPipe } from "@multiversx/sdk-nestjs-common";
import { Controller, DefaultValuePipe, Get, NotFoundException, Param, Query } from "@nestjs/common";
import { ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from "@nestjs/swagger";
import { ProofService } from "./proof.service";
import { QueryPagination } from "src/common/entities/query.pagination";
import { ProofFilter } from "./entities/proof.filter";
import { ProofDto } from "./entities/proof.dto";

@Controller()
@ApiTags('proofs')
export class ProofController {
  constructor(
    private readonly proofService: ProofService,
  ) { }

  @Get("/proofs")
  @ApiOperation({summary: 'Proofs list', description: 'Returns the proofs that are currently issued on the chain.'})
  @ApiOkResponse({type: ProofDto, isArray: true})
  @ApiQuery({name: 'from', description: 'Number of items to skip for the result set', required: false})
  @ApiQuery({name: 'size', description: 'Number of items to retrieve', required: false})
  @ApiQuery({name: 'hash', description: 'Returns the proofs with the specified hash', required: false})
  async getProofs(
    @Query('from', new DefaultValuePipe(0), ParseIntPipe) from: number,
    @Query('size', new DefaultValuePipe(25), ParseIntPipe) size: number,
    @Query('hash') hash?: string,
  ): Promise<ProofDto[]> {
    return await this.proofService.getProofs(new QueryPagination({from, size}), new ProofFilter({
      hash: hash,
    }));
  }

  @Get("/proofs/count")
  @ApiOperation({
    summary: 'Proofs count',
    description: 'Returns the number of proofs that are currently issued on the chain.',
  })
  @ApiOkResponse({type: Number})
  @ApiQuery({name: 'hash', description: 'Returns the proofs with the specified hash', required: false})
  async getProofsCount(
    @Query('hash') hash?: string,
  ): Promise<number> {
    return await this.proofService.getProofsCount(new ProofFilter({
      hash: hash,
    }));
  }

  @Get("/proofs/:identifierOrHash")
  @ApiOperation({summary: 'Proof', description: 'Returns an on-chain proof based on either hash or identifier.'})
  @ApiOkResponse({type: ProofDto})
  @ApiNotFoundResponse({description: 'Proof not found'})
  async getProof(
    @Param('identifierOrHash') identifierOfHash: string,
  ): Promise<ProofDto> {
    const proof = await this.proofService.getProof(identifierOfHash);
    if (proof === undefined) {
      throw new NotFoundException('Proof not found');
    }

    return proof;
  }
}
