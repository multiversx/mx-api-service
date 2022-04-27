import { Controller, DefaultValuePipe, Get, NotFoundException, Param, ParseIntPipe, Query } from "@nestjs/common";
import { ApiExcludeEndpoint, ApiQuery, ApiResponse, ApiTags } from "@nestjs/swagger";
import { MexSettings } from "src/endpoints/transactions/transaction-action/recognizers/mex/entities/mex.settings";
import { MexPair } from "./entities/mex.pair";
import { MexEconomicsService } from "./mex.economics.service";
import { MexPairsService } from "./mex.pairs.service";
import { MexSettingsService } from "./mex.settings.service";

@Controller()
@ApiTags('network')
export class MexAnalyticsController {
  constructor(
    private readonly mexEconomicsService: MexEconomicsService,
    private readonly mexSettingsService: MexSettingsService,
    private readonly mexPairsService: MexPairsService
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
  @ApiResponse({
    status: 200,
    description: 'Details of the economics of the Maiar Exchange',
  })
  async getMexEconomics(): Promise<any> {
    return await this.mexEconomicsService.getMexEconomics();
  }

  @Get("/mex-pairs")
  @ApiResponse({
    status: 200,
    description: 'A list of pairs listed on the Maiar Exchange',
  })
  @ApiQuery({ name: 'from', description: 'Numer of items to skip for the result set', required: false })
  @ApiQuery({ name: 'size', description: 'Number of items to retrieve', required: false })
  async getMexPairs(
    @Query('from', new DefaultValuePipe(0), ParseIntPipe) from: number,
    @Query("size", new DefaultValuePipe(25), ParseIntPipe) size: number
  ): Promise<any> {
    return await this.mexPairsService.getMexPairs(from, size);
  }

  @Get("/mex-pairs/:baseId/:quoteId")
  @ApiResponse({
    status: 200,
    description: 'A list of pairs listed on the Maiar Exchange',
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
