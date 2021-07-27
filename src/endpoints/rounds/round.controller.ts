import { Controller, DefaultValuePipe, Get, HttpException, HttpStatus, Param, ParseIntPipe, Query } from "@nestjs/common";
import { ApiExcludeEndpoint, ApiQuery, ApiResponse, ApiTags } from "@nestjs/swagger";
import { QueryConditionOptions } from "src/helpers/entities/elastic/query.condition.options";
import { ParseOptionalEnumPipe } from "src/helpers/pipes/parse.optional.enum.pipe";
import { ParseOptionalIntPipe } from "src/helpers/pipes/parse.optional.int.pipe";
import { Round } from "./entities/round";
import { RoundDetailed } from "./entities/round.detailed";
import { RoundService } from "./round.service";

@Controller()
@ApiTags('rounds')
export class RoundController {
    constructor(private readonly roundService: RoundService) {}
  
    @Get("/rounds")
    @ApiResponse({
      status: 200,
      description: 'The rounds available on the blockchain',
      type: Round,
      isArray: true
    })
    @ApiQuery({ name: 'from', description: 'Numer of items to skip for the result set', required: false })
    @ApiQuery({ name: 'size', description: 'Number of items to retrieve', required: false  })
    @ApiQuery({ name: 'validator', description: 'Filter by validator', required: false  })
    @ApiQuery({ name: 'shard', description: 'Filter by shard identifier', required: false  })
    @ApiQuery({ name: 'epoch', description: 'Filter by epoch number', required: false  })
    getRounds(
      @Query('from', new DefaultValuePipe(0), ParseIntPipe) from: number, 
      @Query("size", new DefaultValuePipe(25), ParseIntPipe) size: number,
      @Query("validator") validator: string | undefined,
      @Query('condition', new ParseOptionalEnumPipe(QueryConditionOptions)) condition: QueryConditionOptions | undefined, 
      @Query("shard", new ParseOptionalIntPipe) shard: number | undefined,
      @Query("epoch", new ParseOptionalIntPipe) epoch: number | undefined,
    ): Promise<Round[]> {
      return this.roundService.getRounds({ from, size, condition, validator, shard, epoch });
    }

    @Get("/rounds/count")
    @ApiResponse({
      status: 200,
      description: 'The number of rounds available on the blockchain',
    })
    @ApiQuery({ name: 'from', description: 'Numer of items to skip for the result set', required: false })
    @ApiQuery({ name: 'size', description: 'Number of items to retrieve', required: false  })
    @ApiQuery({ name: 'validator', description: 'Filter by validator', required: false  })
    @ApiQuery({ name: 'shard', description: 'Filter by shard identifier', required: false  })
    @ApiQuery({ name: 'epoch', description: 'Filter by epoch number', required: false  })
    getRoundCount(
      @Query('from', new DefaultValuePipe(0), ParseIntPipe) from: number, 
      @Query("size", new DefaultValuePipe(25), ParseIntPipe) size: number,
      @Query("validator") validator: string | undefined,
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
      @Query("validator") validator: string | undefined,
      @Query('condition', new ParseOptionalEnumPipe(QueryConditionOptions)) condition: QueryConditionOptions | undefined, 
      @Query("shard", new ParseOptionalIntPipe) shard: number | undefined,
      @Query("epoch", new ParseOptionalIntPipe) epoch: number | undefined,
    ): Promise<number> {
      return this.roundService.getRoundCount({ from, size, condition, validator, shard, epoch });
    }

    @Get("/rounds/:shard/:round")
    @ApiResponse({
      status: 200,
      description: 'The details of a given round',
      type: RoundDetailed
    })
    @ApiResponse({
      status: 404,
      description: 'Round not found'
    })
    async getBlock(
      @Param('shard') shard: number,
      @Param('round') round: number
    ): Promise<RoundDetailed> {
      try {
        return await this.roundService.getRound(shard, round);
      } catch {
        throw new HttpException('Round not found', HttpStatus.NOT_FOUND);
      }
    }
}