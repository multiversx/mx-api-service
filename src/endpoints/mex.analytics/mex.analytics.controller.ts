import { MexEconomics } from './entities/mex.economics';
import { MexToken } from './entities/mex.token';
import { Controller, DefaultValuePipe, Get, NotFoundException, Param, ParseIntPipe, Query } from "@nestjs/common";
import { ApiExcludeEndpoint, ApiOperation, ApiQuery, ApiResponse, ApiTags } from "@nestjs/swagger";
import { MexPair } from "./entities/mex.pair";
import { MexSettings } from "./entities/mex.settings";
import { MexEconomicsService } from "./mex.economics.service";
import { MexPairsService } from "./mex.pairs.service";
import { MexSettingsService } from "./mex.settings.service";
import { MexTokenService } from "./mex.token.service";

@Controller()
@ApiTags('network')
export class MexAnalyticsController {
  constructor(
    private readonly mexEconomicsService: MexEconomicsService,
    private readonly mexSettingsService: MexSettingsService,
    private readonly mexPairsService: MexPairsService,
    private readonly mexTokensService: MexTokenService,
  ) { }

  @Get("/mex-settings")
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

  @Get("/mex-economics")
  @ApiOperation({
    summary: 'Maiar Exchange economics',
    description: 'Returns economics details of Maiar Exchange',
  })
  @ApiResponse({
    status: 200,
    type: MexEconomics,
  })
  async getMexEconomics(): Promise<any> {
    return await this.mexEconomicsService.getMexEconomics();
  }

  @Get("/mex-pairs")
  @ApiOperation({
    summary: 'Maiar Exchange pairs',
    description: 'Returns active liquidity pools available on Maiar Exchange',
  })
  @ApiResponse({
    status: 200,
    isArray: true,
    type: MexPair,
  })
  @ApiQuery({name: 'from', description: 'Number of items to skip for the result set', required: false})
  @ApiQuery({name: 'size', description: 'Number of items to retrieve', required: false})
  async getMexPairs(
    @Query('from', new DefaultValuePipe(0), ParseIntPipe) from: number,
    @Query("size", new DefaultValuePipe(25), ParseIntPipe) size: number
  ): Promise<any> {
    return await this.mexPairsService.getMexPairs(from, size);
  }

  @Get("/mex-tokens")
  @ApiOperation({
    summary: 'Maiar Exchange tokens details',
    description: 'Returns a list of tokens listed on Maiar Exchange',
  })
  @ApiResponse({
    status: 200,
    isArray: true,
    type: MexToken,
  })
  @ApiQuery({name: 'from', description: 'Number of items to skip for the result set', required: false})
  @ApiQuery({name: 'size', description: 'Number of items to retrieve', required: false})
  async getMexTokens(
    @Query('from', new DefaultValuePipe(0), ParseIntPipe) from: number,
    @Query("size", new DefaultValuePipe(25), ParseIntPipe) size: number
  ): Promise<any> {
    return await this.mexTokensService.getMexTokens(from, size);
  }

  @Get("/mex-pairs/:baseId/:quoteId")
  @ApiOperation({
    summary: 'Maiar Exchange pairs details',
    description: 'Returns liquidity pool details by providing a combination of two tokens',
  })
  @ApiResponse({
    status: 200,
    type: MexPair,
  })
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
}
