import { MexEconomics } from './entities/mex.economics';
import { MexToken } from './entities/mex.token';
import { Controller, DefaultValuePipe, Get, NotFoundException, Param, Query } from "@nestjs/common";
import { ApiExcludeEndpoint, ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiQuery, ApiResponse, ApiTags } from "@nestjs/swagger";
import { MexPair } from "./entities/mex.pair";
import { MexSettings } from "./entities/mex.settings";
import { MexEconomicsService } from "./mex.economics.service";
import { MexPairService } from "./mex.pair.service";
import { MexSettingsService } from "./mex.settings.service";
import { MexTokenService } from "./mex.token.service";
import { MexFarmService } from './mex.farm.service';
import { MexFarm } from './entities/mex.farm';
import { QueryPagination } from 'src/common/entities/query.pagination';
import { ParseIntPipe, ParseTokenPipe, ParseEnumPipe, ParseBoolPipe } from '@multiversx/sdk-nestjs-common';
import { MexPairExchange } from './entities/mex.pair.exchange';
import { MexPairsFilter } from './entities/mex.pairs..filter';
import { MexTokenChartsService } from './mex.token.charts.service';
import { MexTokenChart } from './entities/mex.token.chart';

@Controller()
@ApiTags('xexchange')
export class MexController {
  constructor(
    private readonly mexEconomicsService: MexEconomicsService,
    private readonly mexSettingsService: MexSettingsService,
    private readonly mexPairsService: MexPairService,
    private readonly mexTokensService: MexTokenService,
    private readonly mexFarmsService: MexFarmService,
    private readonly mexTokenChartsService: MexTokenChartsService
  ) { }

  @Get("/mex/settings")
  @ApiExcludeEndpoint()
  @ApiResponse({ status: 200, description: 'The settings of the xExchange' })
  @ApiNotFoundResponse({ description: 'MEX settings not found' })
  async getMexSettings(): Promise<MexSettings> {
    const settings = await this.mexSettingsService.getSettings();
    if (!settings) {
      throw new NotFoundException('MEX settings not found');
    }
    return settings;
  }

  @Get("/mex/economics")
  @ApiOperation({ summary: 'xExchange economics', description: 'Returns economics details of xExchange' })
  @ApiOkResponse({ type: MexEconomics })
  async getMexEconomics(): Promise<MexEconomics> {
    return await this.mexEconomicsService.getMexEconomics();
  }

  @Get("/mex/pairs")
  @ApiOperation({ summary: 'xExchange pairs', description: 'Returns active liquidity pools available on xExchange' })
  @ApiOkResponse({ type: [MexPair] })
  @ApiQuery({ name: 'from', description: 'Number of items to skip for the result set', required: false })
  @ApiQuery({ name: 'size', description: 'Number of items to retrieve', required: false })
  @ApiQuery({ name: 'exchange', description: 'Filter by exchange', required: false, enum: MexPairExchange })
  @ApiQuery({ name: 'includeFarms', description: 'Include farms information in response', required: false, type: Boolean })
  async getMexPairs(
    @Query('from', new DefaultValuePipe(0), ParseIntPipe) from: number,
    @Query("size", new DefaultValuePipe(25), ParseIntPipe) size: number,
    @Query('exchange', new ParseEnumPipe(MexPairExchange)) exchange?: MexPairExchange,
    @Query('includeFarms', new DefaultValuePipe(false), ParseBoolPipe) includeFarms?: boolean,
  ): Promise<MexPair[]> {
    const filter = new MexPairsFilter({ exchange, includeFarms });
    return await this.mexPairsService.getMexPairs(from, size, filter);
  }

  @Get("/mex-pairs")
  @ApiOperation({ summary: 'xExchange pairs', description: 'Returns active liquidity pools available on xExchange', deprecated: true })
  @ApiOkResponse({ type: [MexPair] })
  @ApiQuery({ name: 'from', description: 'Number of items to skip for the result set', required: false })
  @ApiQuery({ name: 'size', description: 'Number of items to retrieve', required: false })
  @ApiQuery({ name: 'exchange', description: 'Filter by exchange', required: false, enum: MexPairExchange })
  async getMexPairsTemp(
    @Query('from', new DefaultValuePipe(0), ParseIntPipe) from: number,
    @Query("size", new DefaultValuePipe(25), ParseIntPipe) size: number,
    @Query('exchange', new ParseEnumPipe(MexPairExchange)) exchange?: MexPairExchange,
  ): Promise<MexPair[]> {
    const filter = new MexPairsFilter({ exchange });
    return await this.mexPairsService.getMexPairs(from, size, filter);
  }

  @Get("/mex/pairs/count")
  @ApiOperation({ summary: 'Maiar Exchange pairs count', description: 'Returns active liquidity pools count available on Maiar Exchange' })
  @ApiQuery({ name: 'exchange', description: 'Filter by exchange', required: false, enum: MexPairExchange })
  @ApiQuery({ name: 'includeFarms', description: 'Include farms information in response', required: false, type: Boolean })
  async getMexPairsCount(
    @Query('exchange', new ParseEnumPipe(MexPairExchange)) exchange?: MexPairExchange,
    @Query('includeFarms', new DefaultValuePipe(false), ParseBoolPipe) includeFarms?: boolean,
  ): Promise<number> {
    const filter = new MexPairsFilter({ exchange, includeFarms });
    return await this.mexPairsService.getMexPairsCount(filter);
  }

  @Get("/mex/tokens")
  @ApiOperation({ summary: 'xExchange tokens details', description: 'Returns a list of tokens listed on xExchange' })
  @ApiOkResponse({ type: [MexToken] })
  @ApiQuery({ name: 'from', description: 'Number of items to skip for the result set', required: false })
  @ApiQuery({ name: 'size', description: 'Number of items to retrieve', required: false })
  async getMexTokens(
    @Query('from', new DefaultValuePipe(0), ParseIntPipe) from: number,
    @Query("size", new DefaultValuePipe(25), ParseIntPipe) size: number,
  ): Promise<MexToken[]> {
    return await this.mexTokensService.getMexTokens(new QueryPagination({ from, size }));
  }

  @Get("/mex/tokens/count")
  @ApiOperation({ summary: 'Maiar Exchange tokens count', description: 'Returns tokens count available on Maiar Exchange' })
  async getMexTokensCount(
  ): Promise<number> {
    return await this.mexTokensService.getMexTokensCount();
  }

  @Get("/mex/tokens/:identifier")
  @ApiOperation({ summary: 'xExchange token details', description: 'Returns a specific token listed on xExchange' })
  @ApiOkResponse({ type: MexToken })
  @ApiNotFoundResponse({ description: 'Token not found' })
  async getMexTokenIdentifier(
    @Param('identifier', ParseTokenPipe) identifier: string
  ): Promise<MexToken> {
    const mexToken = await this.mexTokensService.getMexTokenByIdentifier(identifier);
    if (!mexToken) {
      throw new NotFoundException('Token not found');
    }

    return mexToken;
  }

  @Get("/mex/farms")
  @ApiOperation({ summary: 'xExchange farms details', description: 'Returns a list of farms listed on xExchange' })
  @ApiOkResponse({ type: [MexFarm] })
  @ApiQuery({ name: 'from', description: 'Number of items to skip for the result set', required: false })
  @ApiQuery({ name: 'size', description: 'Number of items to retrieve', required: false })
  async getMexFarms(
    @Query('from', new DefaultValuePipe(0), ParseIntPipe) from: number,
    @Query("size", new DefaultValuePipe(25), ParseIntPipe) size: number
  ): Promise<MexFarm[]> {
    return await this.mexFarmsService.getMexFarms(new QueryPagination({ from, size }));
  }

  @Get("/mex/farms/count")
  @ApiOperation({ summary: 'Maiar Exchange farms count', description: 'Returns farms count available on Maiar Exchange' })
  async getMexFarmsCount(
  ): Promise<number> {
    return await this.mexFarmsService.getMexFarmsCount();
  }

  @Get("/mex/pairs/:baseId/:quoteId")
  @ApiOperation({ summary: 'xExchange pairs details', description: 'Returns liquidity pool details by providing a combination of two tokens' })
  @ApiOkResponse({ type: MexPair })
  @ApiNotFoundResponse({ description: 'Pair not found' })
  @ApiQuery({ name: 'includeFarms', description: 'Include farms information in response', required: false, type: Boolean })
  async getMexPair(
    @Param('baseId') baseId: string,
    @Param('quoteId') quoteId: string,
    @Query('includeFarms', new DefaultValuePipe(false), ParseBoolPipe) includeFarms?: boolean,
  ): Promise<MexPair> {
    const pair = await this.mexPairsService.getMexPair(baseId, quoteId, includeFarms);
    if (!pair) {
      throw new NotFoundException('Pair not found');
    }

    return pair;
  }

  @Get('mex/tokens/prices/hourly/:identifier')
  @ApiOperation({ summary: 'xExchange token prices hourly', description: 'Returns token prices hourly' })
  @ApiOkResponse({ type: [MexTokenChart] })
  @ApiNotFoundResponse({ description: 'Price not available for given token identifier' })
  async getTokenPricesHourResolution(
    @Param('identifier', ParseTokenPipe) identifier: string): Promise<MexTokenChart[] | undefined> {
    const charts = await this.mexTokenChartsService.getTokenPricesHourResolution(identifier);
    if (!charts) {
      throw new NotFoundException('Price not available for given token identifier');
    }

    return charts;
  }

  @Get('mex/tokens/prices/daily/:identifier')
  @ApiOperation({
    summary: 'xExchange token prices daily',
    description: 'Returns token prices daily, ordered by timestamp in ascending order. The entries represent the latest complete daily values for the given token series.',
  })
  @ApiOkResponse({ type: [MexTokenChart] })
  @ApiNotFoundResponse({ description: 'Price not available for given token identifier' })
  async getTokenPricesDayResolution(
    @Param('identifier', ParseTokenPipe) identifier: string): Promise<MexTokenChart[] | undefined> {
    const charts = await this.mexTokenChartsService.getTokenPricesDayResolution(identifier);
    if (!charts) {
      throw new NotFoundException('Price not available for given token identifier');
    }

    return charts;
  }
}
