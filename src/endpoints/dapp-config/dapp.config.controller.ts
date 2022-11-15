import { DappConfig } from './entities/dapp-config';
import { Controller, Get, HttpException, HttpStatus } from "@nestjs/common";
import { ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { DappConfigService } from "./dapp.config.service";

@Controller()
@ApiTags('dapp/config')
export class DappConfigController {
  constructor(
    private readonly dappConfigService: DappConfigService,
  ) { }

  @Get("/dapp/config")
  @ApiOperation({ summary: 'Dapp configuration', description: 'Returns configuration used in dapps' })
  @ApiOkResponse({ type: DappConfig })
  @ApiNotFoundResponse({ description: 'Network configuration not found' })
  getDappConfiguration(): DappConfig {
    const configuration = this.dappConfigService.getDappConfiguration();
    if (!configuration) {
      throw new HttpException(`Network configuration not found`, HttpStatus.NOT_FOUND);
    }

    return configuration;
  }
}
