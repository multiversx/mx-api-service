import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { NetworkConstants } from './entities/constants';
import { Economics } from './entities/economics';
import { NetworkService } from './network.service';
import { Stats } from 'src/endpoints/network/entities/stats';

@Controller()
@ApiTags('network')
export class NetworkController {
  constructor(
    private readonly networkService: NetworkService
  ) { }

  @Get("/constants")
  @ApiOperation({ summary: 'Network constants', description: 'Returns network-specific constants that can be used to automatically configure dapps' })
  @ApiOkResponse({ type: NetworkConstants })
  getConstants(): Promise<NetworkConstants> {
    return this.networkService.getConstants();
  }

  @Get("/economics")
  @ApiOperation({ summary: 'Network economics', description: 'Returns general economics information' })
  @ApiOkResponse({ type: Economics })
  async getEconomics(): Promise<Economics> {
    return await this.networkService.getEconomics();
  }

  @Get("/stats")
  @ApiOperation({ summary: 'Network statistics', description: 'Returns general network statistics' })
  @ApiOkResponse({ type: Stats })
  async getStats(): Promise<Stats> {
    return await this.networkService.getStats();
  }
}
