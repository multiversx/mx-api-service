import { MexEconomics } from './entities/mex.economics';
import { MexToken } from './entities/mex.token';
import { Controller, DefaultValuePipe, Get, NotFoundException, Param, ParseIntPipe, Query } from "@nestjs/common";
import { ApiExcludeEndpoint, ApiOkResponse, ApiOperation, ApiQuery, ApiResponse, ApiTags } from "@nestjs/swagger";
import { MexPair } from "./entities/mex.pair";
import { MexSettings } from "./entities/mex.settings";
import { MexEconomicsService } from "./mex.economics.service";
import { MexPairService } from "./mex.pair.service";
import { MexSettingsService } from "./mex.settings.service";
import { MexTokenService } from "./mex.token.service";
import { MexFarmService } from './mex.farm.service';
import { MexFarm } from './entities/mex.farm';

@Controller()
@ApiTags('maiar.exchange')
export class MexController {
  constructor(
    private readonly mexEconomicsService: MexEconomicsService,
    private readonly mexSettingsService: MexSettingsService,
    private readonly mexPairsService: MexPairService,
    private readonly mexTokensService: MexTokenService,
    private readonly mexFarmsService: MexFarmService
  ) { }

  @Get("/mex/settings")
  @ApiExcludeEndpoint()
  @ApiResponse({
    status: 200,
    description: 'The settings of the Maiar Exchange',
  })
  async getMexSettings(): Promise<MexSettings> {
    const settings = await this.mexSettingsService.getSettings();
    if (!settings) {
      throw new NotFoundException('MEX settings not found');
    }

    return settings;
  }

  @Get("/mex/economics")
  @ApiOperation({ summary: 'Maiar Exchange economics', description: 'Returns economics details of Maiar Exchange' })
  @ApiOkResponse({ type: MexEconomics })

  async getMexEconomics(): Promise<any> {
    return await this.mexEconomicsService.getMexEconomics();
  }

  @Get("/mex/pairs")
  @ApiOperation({ summary: 'Maiar Exchange pairs', description: 'Returns active liquidity pools available on Maiar Exchange' })
  @ApiOkResponse({ type: [MexPair] })

  @ApiQuery({ name: 'from', description: 'Number of items to skip for the result set', required: false })
  @ApiQuery({ name: 'size', description: 'Number of items to retrieve', required: false })

  async getMexPairs(
    @Query('from', new DefaultValuePipe(0), ParseIntPipe) from: number,
    @Query("size", new DefaultValuePipe(25), ParseIntPipe) size: number
  ): Promise<any> {
    return await this.mexPairsService.getMexPairs(from, size);
  }

  @Get("/mex/tokens")
  @ApiOperation({ summary: 'Maiar Exchange tokens details', description: 'Returns a list of tokens listed on Maiar Exchange' })
  @ApiOkResponse({ type: [MexToken] })

  @ApiQuery({ name: 'from', description: 'Number of items to skip for the result set', required: false })
  @ApiQuery({ name: 'size', description: 'Number of items to retrieve', required: false })
  async getMexTokens(
    @Query('from', new DefaultValuePipe(0), ParseIntPipe) from: number,
    @Query("size", new DefaultValuePipe(25), ParseIntPipe) size: number
  ): Promise<any> {
    return await this.mexTokensService.getMexTokens(from, size);
  }

  @Get("/mex/farms")
  @ApiOperation({ summary: 'Maiar Exchange farms details', description: 'Returns a list of farms listed on Maiar Exchange' })
  @ApiOkResponse({ type: [MexFarm] })

  @ApiQuery({ name: 'from', description: 'Number of items to skip for the result set', required: false })
  @ApiQuery({ name: 'size', description: 'Number of items to retrieve', required: false })
  async getMexFarms(
    @Query('from', new DefaultValuePipe(0), ParseIntPipe) from: number,
    @Query("size", new DefaultValuePipe(25), ParseIntPipe) size: number
  ): Promise<any> {
    return await this.mexFarmsService.getMexFarms(from, size);
  }

  @Get("/mex/pairs/:baseId/:quoteId")
  @ApiOperation({ summary: 'Maiar Exchange pairs details', description: 'Returns liquidity pool details by providing a combination of two tokens' })
  @ApiOkResponse({ type: MexPair })

  async getMexPair(
    @Param('baseId') baseId: string,
    @Param('quoteId') quoteId: string,
  ): Promise<MexPair> {
    const pair = await this.mexPairsService.getMexPair(baseId, quoteId);
    if (!pair) {
      throw new NotFoundException();
    }

    return pair;
  }

  @Get("/mex-economics")
  @ApiOperation({ deprecated: true, summary: 'Maiar Exchange economics', description: 'Returns economics details of Maiar Exchange' })
  @ApiOkResponse({ type: MexEconomics })

  async getMexEconomicsLegacy(): Promise<any> {
    return await this.mexEconomicsService.getMexEconomics();
  }

  @Get("/mex-settings")
  @ApiOperation({ deprecated: true })
  @ApiExcludeEndpoint()
  @ApiResponse({
    status: 200,
    description: 'The settings of the Maiar Exchange',
  })
  async getMexSettingsLegacy(): Promise<MexSettings> {
    const settings = await this.mexSettingsService.getSettings();
    if (!settings) {
      throw new NotFoundException('MEX settings not found');
    }

    return settings;
  }

  @Get("/mex-pairs")
  @ApiOperation({
    deprecated: true,
    summary: 'Maiar Exchange pairs',
    description: 'Returns active liquidity pools available on Maiar Exchange',
  })
  @ApiResponse({
    status: 200,
    isArray: true,
    type: MexPair,
  })
  @ApiQuery({ name: 'from', description: 'Number of items to skip for the result set', required: false })
  @ApiQuery({ name: 'size', description: 'Number of items to retrieve', required: false })
  async getMexPairsLegacy(
    @Query('from', new DefaultValuePipe(0), ParseIntPipe) from: number,
    @Query("size", new DefaultValuePipe(25), ParseIntPipe) size: number
  ): Promise<any> {
    return await this.mexPairsService.getMexPairs(from, size);
  }

  @Get("/mex-tokens")
  @ApiOperation({
    deprecated: true,
    summary: 'Maiar Exchange tokens details',
    description: 'Returns a list of tokens listed on Maiar Exchange',
  })
  @ApiResponse({
    status: 200,
    isArray: true,
    type: MexToken,
  })
  @ApiQuery({ name: 'from', description: 'Number of items to skip for the result set', required: false })
  @ApiQuery({ name: 'size', description: 'Number of items to retrieve', required: false })
  async getMexTokensLegacy(
    @Query('from', new DefaultValuePipe(0), ParseIntPipe) from: number,
    @Query("size", new DefaultValuePipe(25), ParseIntPipe) size: number
  ): Promise<any> {
    return await this.mexTokensService.getMexTokens(from, size);
  }

  @Get("/mex-pairs/:baseId/:quoteId")
  @ApiOperation({
    deprecated: true,
    summary: 'Maiar Exchange pairs details',
    description: 'Returns liquidity pool details by providing a combination of two tokens',
  })
  @ApiResponse({
    status: 200,
    type: MexPair,
  })
  async getMexPairLegacy(
    @Param('baseId') baseId: string,
    @Param('quoteId') quoteId: string,
  ): Promise<MexPair> {
    const pair = await this.mexPairsService.getMexPair(baseId, quoteId);
    if (!pair) {
      throw new NotFoundException();
    }

    return pair;
  }
}
