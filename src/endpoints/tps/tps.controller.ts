import { Controller, Get, Param } from "@nestjs/common";
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

  @Get('/latest/:frequency')
  @ApiOperation({ summary: 'TPS live info', description: 'Return TPS live info' })
  @ApiOkResponse({ type: Tps })
  async getTpsLive(
    @Param('frequency', new ParseEnumPipe(TpsFrequency)) frequency: TpsFrequency,
  ): Promise<Tps> {
    return await this.tpsService.getTpsLive(frequency);
  }

  @Get('/history/:interval')
  @ApiOperation({ summary: 'TPS history info', description: 'Return TPS history info' })
  @ApiOkResponse({ type: Tps, isArray: true })
  async getTpsHistory(
    @Param('interval', new ParseEnumPipe(TpsInterval)) interval: TpsInterval,
  ): Promise<Tps[]> {
    return await this.tpsService.getTpsHistory(interval);
  }
}
