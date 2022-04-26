import {
  Controller,
  DefaultValuePipe,
  Get,
  HttpException,
  HttpStatus,
  Param,
  ParseIntPipe,
  Query,
} from "@nestjs/common";
import { ApiExcludeEndpoint, ApiOperation, ApiQuery, ApiResponse, ApiTags } from "@nestjs/swagger";
import { QueryConditionOptions } from "src/common/elastic/entities/query.condition.options";
import { ParseBlsHashPipe } from "src/utils/pipes/parse.bls.hash.pipe";
import { ParseOptionalEnumPipe } from "src/utils/pipes/parse.optional.enum.pipe";
import { ParseOptionalIntPipe } from "src/utils/pipes/parse.optional.int.pipe";
import { Round } from "./entities/round";
import { RoundDetailed } from "./entities/round.detailed";
import { RoundService } from "./round.service";

@Controller()
@ApiTags('rounds')
export class RoundController {
  constructor(private readonly roundService: RoundService) { }

  @Get("/rounds")
  @ApiOperation({
    summary: 'Rounds details',
    description: 'Returns rounds details from a specific epoch, shard and validator and also return a list of all rounds available on blockchain',
  })
  @ApiResponse({
    status: 200,
    description: 'The rounds available on the blockchain',
    type: Round,
    isArray: true,
  })
  @ApiQuery({name: 'from', description: 'Number of items to skip for the result set', required: false})
  @ApiQuery({name: 'size', description: 'Number of items to retrieve', required: false})
  @ApiQuery({ name: 'validator', description: 'Filter by validator', required: false })
  @ApiQuery({ name: 'shard', description: 'Filter by shard identifier', required: false })
  @ApiQuery({ name: 'epoch', description: 'Filter by epoch number', required: false })
  getRounds(
    @Query('from', new DefaultValuePipe(0), ParseIntPipe) from: number,
    @Query("size", new DefaultValuePipe(25), ParseIntPipe) size: number,
    @Query("validator", ParseBlsHashPipe) validator: string | undefined,
    @Query('condition', new ParseOptionalEnumPipe(QueryConditionOptions)) condition: QueryConditionOptions | undefined,
    @Query("shard", new ParseOptionalIntPipe) shard: number | undefined,
    @Query("epoch", new ParseOptionalIntPipe) epoch: number | undefined,
  ): Promise<Round[]> {
    return this.roundService.getRounds({ from, size, condition, validator, shard, epoch });
  }

  @Get("/rounds/count")
  @ApiOperation({
    summary: 'Total rounds number',
    description: 'Return total number of rounds as well returns total number of rounds from a certain epoch, from a certain shard and validator',
  })
  @ApiResponse({
    status: 200,
    description: 'The number of rounds available on the blockchain',
    type: Number,
  })
  @ApiQuery({ name: 'from', description: 'Numer of items to skip for the result set', required: false })
  @ApiQuery({ name: 'size', description: 'Number of items to retrieve', required: false })
  @ApiQuery({ name: 'validator', description: 'Filter by validator', required: false })
  @ApiQuery({ name: 'shard', description: 'Filter by shard identifier', required: false })
  @ApiQuery({ name: 'epoch', description: 'Filter by epoch number', required: false })
  getRoundCount(
    @Query('from', new DefaultValuePipe(0), ParseIntPipe) from: number,
    @Query("size", new DefaultValuePipe(25), ParseIntPipe) size: number,
    @Query("validator", ParseBlsHashPipe) validator: string | undefined,
    @Query('condition', new ParseOptionalEnumPipe(QueryConditionOptions)) condition: QueryConditionOptions | undefined,
    @Query("shard", new ParseOptionalIntPipe) shard: number | undefined,
    @Query("epoch", new ParseOptionalIntPipe) epoch: number | undefined,
  ): Promise<number> {
    return this.roundService.getRoundCount({ from, size, condition, validator, shard, epoch });
  }

  @Get("/rounds/c")
  @ApiExcludeEndpoint()
  getRoundCountAlternative(
    @Query('from', new DefaultValuePipe(0), ParseIntPipe) from: number,
    @Query("size", new DefaultValuePipe(25), ParseIntPipe) size: number,
    @Query("validator", ParseBlsHashPipe) validator: string | undefined,
    @Query('condition', new ParseOptionalEnumPipe(QueryConditionOptions)) condition: QueryConditionOptions | undefined,
    @Query("shard", new ParseOptionalIntPipe) shard: number | undefined,
    @Query("epoch", new ParseOptionalIntPipe) epoch: number | undefined,
  ): Promise<number> {
    return this.roundService.getRoundCount({ from, size, condition, validator, shard, epoch });
  }

  @Get("/rounds/:shard/:round")
  @ApiOperation({
    summary: 'Details of a given round',
    description: 'Returns details of a given round from a specific shard',
  })
  @ApiResponse({
    status: 200,
    description: 'The details of a given round',
    type: RoundDetailed,
  })
  @ApiResponse({
    status: 404,
    description: 'Round not found',
  })
  async getRound(
    @Param('shard', ParseOptionalIntPipe) shard: number,
    @Param('round', ParseOptionalIntPipe) round: number
  ): Promise<RoundDetailed> {
    try {
      return await this.roundService.getRound(shard, round);
    } catch {
      throw new HttpException('Round not found', HttpStatus.NOT_FOUND);
    }
  }
}
