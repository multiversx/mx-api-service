import { Controller, DefaultValuePipe, Get, HttpException, HttpStatus, Param, ParseIntPipe, Query } from "@nestjs/common";
import { ApiExcludeEndpoint, ApiQuery, ApiResponse, ApiTags } from "@nestjs/swagger";
import { TokenDetailed } from "./entities/token.detailed";
import { TokenService } from "./token.service";

@Controller()
@ApiTags('tokens')
export class TokenController {
  constructor(private readonly tokenService: TokenService) {}

  @Get("/tokens")
  @ApiResponse({
    status: 200,
    description: 'The list of tokens available on the blockchain',
    type: TokenDetailed,
    isArray: true
  })
	@ApiQuery({ name: 'from', description: 'Numer of items to skip for the result set', required: false })
	@ApiQuery({ name: 'size', description: 'Number of items to retrieve', required: false })
	@ApiQuery({ name: 'search', description: 'Search by token name / identifier', required: false })
	@ApiQuery({ name: 'name', description: 'Search by token name', required: false })
	@ApiQuery({ name: 'identifier', description: 'Search by token identifier', required: false })
	@ApiQuery({ name: 'identifiers', description: 'Search by multiple token identifiers, comma-separated', required: false })
  async getTokens(
		@Query('from', new DefaultValuePipe(0), ParseIntPipe) from: number, 
		@Query('size', new DefaultValuePipe(25), ParseIntPipe) size: number,
		@Query('search') search: string | undefined,
		@Query('name') name: string | undefined,
		@Query('identifier') identifier: string | undefined,
		@Query('identifiers') identifiers: string | undefined,
  ): Promise<TokenDetailed[]> {
    return await this.tokenService.getTokens({ from, size }, { search, name, identifier, identifiers });
  }

  @Get("/tokens/count")
  @ApiResponse({
    status: 200,
    description: 'The number of tokens available on the blockchain',
  })
  @ApiQuery({ name: 'search', description: 'Filter tokens by token name', required: false })
	@ApiQuery({ name: 'name', description: 'Search by token name', required: false })
	@ApiQuery({ name: 'identifier', description: 'Search by token identifier', required: false })
	@ApiQuery({ name: 'identifiers', description: 'Search by multiple token identifiers, comma-separated', required: false })
  async getTokenCount(
    @Query('search') search: string | undefined,
		@Query('name') name: string | undefined,
		@Query('identifier') identifier: string | undefined,
		@Query('identifiers') identifiers: string | undefined,
    ): Promise<number> {
    return await this.tokenService.getTokenCount({ search, name, identifier, identifiers });
  }

  @Get("/tokens/c")
  @ApiExcludeEndpoint()
  async getTokenCountAlternative(
    @Query('search') search: string | undefined,
		@Query('name') name: string | undefined,
		@Query('identifier') identifier: string | undefined,
		@Query('identifiers') identifiers: string | undefined,
    ): Promise<number> {
    return await this.tokenService.getTokenCount({ search, name, identifier, identifiers });
  }

  @Get('/tokens/:identifier')
  @ApiResponse({
    status: 200,
    description: 'Token details',
    type: TokenDetailed,
  })
  @ApiResponse({
    status: 404,
    description: 'Token not found'
  })
  async getToken(@Param('identifier') identifier: string): Promise<TokenDetailed> {
    let token = await this.tokenService.getToken(identifier);
    if (token === undefined) {
      throw new HttpException('Token not found', HttpStatus.NOT_FOUND);
    }

    return token;
  }
}