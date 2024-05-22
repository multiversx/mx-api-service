import { Controller, Get, NotFoundException, Param } from "@nestjs/common";
import { ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { Tps } from "./entities/tps";
import { ParseEnumPipe } from "@multiversx/sdk-nestjs-common";
import { TpsFrequency } from "./entities/tps.frequency";
import { TpsService } from "./tps.service";
import { TpsInterval } from "./entities/tps.interval";

@Controller('tps')
@ApiTags('tps')
export class TpsController {
  constructor(
    private readonly tpsService: TpsService,
  ) { }

  @Get('/latest')
  @ApiOperation({ summary: 'TPS live info', description: 'Return TPS live info' })
  @ApiOkResponse({ type: Tps })
  async getTpsLatest(): Promise<Tps> {
    return await this.tpsService.getTpsLatest(TpsFrequency._30s);
  }

  @Get('/latest/:frequency')
  @ApiOperation({ summary: 'TPS live info', description: 'Return TPS live info' })
  @ApiOkResponse({ type: Tps })
  async getTpsLatestByFrequency(
    @Param('frequency', new ParseEnumPipe(TpsFrequency)) frequency: TpsFrequency,
  ): Promise<Tps> {
    return await this.tpsService.getTpsLatest(frequency);
  }

  @Get('/max')
  @ApiOperation({ summary: 'TPS max info', description: 'Return TPS max info' })
  @ApiOkResponse({ type: Tps })
  async getTpsMax(): Promise<Tps> {
    const maxTps = await this.tpsService.getTpsMax(TpsInterval._1h);
    if (!maxTps) {
      throw new NotFoundException('No TPS max info found');
    }

    return maxTps;
  }

  @Get('/max/:interval')
  @ApiOperation({ summary: 'TPS max info', description: 'Return TPS max info' })
  @ApiOkResponse({ type: Tps })
  async getTpsMaxByFrequency(
    @Param('interval', new ParseEnumPipe(TpsInterval)) interval: TpsInterval,
  ): Promise<Tps> {
    const maxTps = await this.tpsService.getTpsMax(interval);
    if (!maxTps) {
      throw new NotFoundException('No TPS max info found');
    }

    return maxTps;
  }

  @Get('/history')
  @ApiOperation({ summary: 'TPS history info', description: 'Return TPS history info' })
  @ApiOkResponse({ type: Tps, isArray: true })
  async getTpsHistory(): Promise<Tps[]> {
    return await this.tpsService.getTpsHistory(TpsInterval._1h);
  }

  @Get('/history/:interval')
  @ApiOperation({ summary: 'TPS history info', description: 'Return TPS history info' })
  @ApiOkResponse({ type: Tps, isArray: true })
  async getTpsHistoryByInterval(
    @Param('interval', new ParseEnumPipe(TpsInterval)) interval: TpsInterval,
  ): Promise<Tps[]> {
    return await this.tpsService.getTpsHistory(interval);
  }
}
