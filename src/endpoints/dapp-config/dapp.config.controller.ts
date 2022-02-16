import { Controller, Get, HttpException, HttpStatus } from "@nestjs/common";
import { ApiResponse, ApiTags } from "@nestjs/swagger";
import { DappConfigService } from "./dapp.config.service";

@Controller()
@ApiTags('dapp/config')
export class DappConfigController {
  constructor(
    private readonly dappConfigService: DappConfigService,
  ) { }

  @Get("/dapp/config")
  @ApiResponse({
    status: 200,
    description: 'Dapp configuration for specified network',
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
