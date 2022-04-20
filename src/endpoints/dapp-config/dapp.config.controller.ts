import { DappConfig } from './entities/dapp-config';
import { Controller, Get, HttpException, HttpStatus } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { DappConfigService } from "./dapp.config.service";

@Controller()
@ApiTags('dapp/config')
export class DappConfigController {
  constructor(
    private readonly dappConfigService: DappConfigService,
  ) { }

  @Get("/dapp/config")
  @ApiOperation({ summary: 'Dapp configuration network', description: 'Returns Dapp configuration for a specified network' })
  @ApiResponse({
    status: 200,
    description: 'Dapp configuration for specified network',
    type: DappConfig,
  })
  @ApiResponse({
    status: 404,
    description: 'Network configuration not found',
  })
  getDappConfiguration(): any {
    const configuration = this.dappConfigService.getDappConfiguration();
    if (!configuration) {
      throw new HttpException(`Network configuration not found`, HttpStatus.NOT_FOUND);
    }

    return configuration;
  }
}
