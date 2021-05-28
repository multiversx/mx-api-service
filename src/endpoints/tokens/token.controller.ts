import { Controller, DefaultValuePipe, Get, HttpException, HttpStatus, Param, ParseIntPipe, Query } from "@nestjs/common";
import { ApiQuery, ApiResponse, ApiTags } from "@nestjs/swagger";
import { Token } from "./entities/token";
import { TokenService } from "./token.service";

@Controller()
@ApiTags('tokens')
export class TokenController {
  constructor(private readonly tokenService: TokenService) {}

  @Get("/tokens")
  @ApiResponse({
    status: 200,
    description: 'List tokens',
    type: Token,
    isArray: true
  })
	@ApiQuery({ name: 'from', description: 'Numer of items to skip for the result set', required: false })
	@ApiQuery({ name: 'size', description: 'Number of items to retrieve', required: false })
	@ApiQuery({ name: 'search', description: 'Search by token name', required: false })
  async getTokens(
		@Query('from', new DefaultValuePipe(0), ParseIntPipe) from: number, 
		@Query('size', new DefaultValuePipe(25), ParseIntPipe) size: number,
		@Query('search') search: string | undefined,
  ): Promise<Token[]> {
    return await this.tokenService.getTokens(from, size, search);
  }

  @Get("/tokens/count")
  @ApiResponse({
    status: 200,
    description: 'The number of tokens available on the blockchain',
  })
  async getTokenCount(): Promise<number> {
    return await this.tokenService.getTokenCount();
  }

  @Get('/tokens/:identifier')
  @ApiResponse({
    status: 200,
    description: 'Token details',
    type: Token,
  })
  @ApiResponse({
    status: 404,
    description: 'Token not found'
  })
  async getToken(@Param('identifier') identifier: string): Promise<Token> {
    let token = await this.tokenService.getToken(identifier);
    if (token === undefined) {
      throw new HttpException('Token not found', HttpStatus.NOT_FOUND);
    }

    return token;
  }

  @Get("/nfts")
  @ApiResponse({
    status: 200,
    description: 'List non-fungible and semi-fungible tokens',
    type: Token,
    isArray: true
  })
	@ApiQuery({ name: 'from', description: 'Numer of items to skip for the result set', required: false })
	@ApiQuery({ name: 'size', description: 'Number of items to retrieve', required: false })
	@ApiQuery({ name: 'search', description: 'Search by token name', required: false })
  async getNfts(
		@Query('from', new DefaultValuePipe(0), ParseIntPipe) from: number, 
		@Query('size', new DefaultValuePipe(25), ParseIntPipe) size: number,
		@Query('search') search: string | undefined,
  ): Promise<Token[]> {
    return await this.tokenService.getNfts(from, size, search);
  }

  @Get("/nfts/count")
  @ApiResponse({
    status: 200,
    description: 'The number of non-fungible and semi-fungible tokens available on the blockchain',
  })
  async getNftCount(): Promise<number> {
    return await this.tokenService.getNftCount();
  }

  @Get('/nfts/:identifier')
  @ApiResponse({
    status: 200,
    description: 'Non-fungible / semi-fungible token details',
    type: Token,
  })
  @ApiResponse({
    status: 404,
    description: 'Token not found'
  })
  async getNft(@Param('identifier') identifier: string): Promise<Token> {
    let token = await this.tokenService.getNft(identifier);
    if (token === undefined) {
      throw new HttpException('NFT not found', HttpStatus.NOT_FOUND);
    }

    return token;
  }
}