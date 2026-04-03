import { Controller, Get, InternalServerErrorException } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { NetworkConstants } from './entities/constants';
import { Economics } from './entities/economics';
import { NetworkService } from './network.service';
import { Stats } from 'src/endpoints/network/entities/stats';
import { About } from './entities/about';
import { OriginLogger } from '@multiversx/sdk-nestjs-common';

@Controller()
@ApiTags('network')
export class NetworkController {
  private readonly logger = new OriginLogger(NetworkController.name);
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
    try {
      return await this.networkService.getStats();
    } catch (error) {
      this.logger.error('Error fetching network stats', error);
      throw new InternalServerErrorException('Failed to fetch network statistics');
    }
  }

  @Get("/about")
  @ApiOperation({ summary: 'About', description: 'Returns general information about API deployment' })
  @ApiOkResponse({ type: About })
  async getAbout(): Promise<About> {
    return await this.networkService.getAbout();
  }
}
