import { Controller, Get } from '@nestjs/common';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { Constants } from './entities/constants';
import { Economics } from './entities/economics';
import { NetworkService } from './network.service';
import { Stats } from 'src/endpoints/network/entities/stats';

@Controller()
@ApiTags('network')
export class NetworkController {
  constructor(
    private readonly networkService: NetworkService
  ) {}

  @Get("/constants")
  @ApiResponse({
    status: 200,
    description: 'The constants',
    type: Constants
  })
  getConstants(): Promise<Constants> {
    return this.networkService.getConstants();
  }

  @Get("/economics")
  @ApiResponse({
    status: 200,
    description: 'The economics details',
    type: Economics
  })
  async getEconomics(): Promise<Economics> {
    return await this.networkService.getEconomics();
  }

  @Get("/stats")
  @ApiResponse({
    status: 200,
    description: 'The network statistics',
    type: Stats
  })
  async getStats(): Promise<Stats> {
    return await this.networkService.getStats();
  }
}
