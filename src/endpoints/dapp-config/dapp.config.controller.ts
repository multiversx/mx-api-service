import { Controller, Get, HttpException, HttpStatus, Param } from "@nestjs/common";
import { ApiResponse, ApiTags } from "@nestjs/swagger";
import { ParseOptionalEnumPipe } from "src/utils/pipes/parse.optional.enum.pipe";
import { DappConfigService } from "./dapp.config.service";
import { DappNetwork } from "./entities/dapp.network";

@Controller()
@ApiTags('dapp/config')
export class DappConfigController {
  constructor(
    private readonly dappConfigService: DappConfigService,
  ) { }

  @Get("/dapp/config/:network")
  @ApiResponse({
    status: 200,
    description: 'Dapp configuration for specified network',
  })
  @ApiResponse({
    status: 404,
    description: 'Network configuration not found',
  })
  getDappConfiguration(@Param('network', new ParseOptionalEnumPipe(DappNetwork)) network: DappNetwork): any {
    const configuration = this.dappConfigService.getDappConfiguration(network);

    if (!configuration) {
      throw new HttpException(`Network configuration not found for network ${network}`, HttpStatus.NOT_FOUND);
    }

    return configuration;
  }
}
