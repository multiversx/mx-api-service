import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
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
  @ApiOperation({ summary: 'Network constants', description: 'Returns network constants' })
  @ApiResponse({
    status: 200,
    description: 'The network constants',
    type: NetworkConstants,
  })
  getConstants(): Promise<NetworkConstants> {
    return this.networkService.getConstants();
  }

  @Get("/economics")
  @ApiOperation({ summary: 'Economics details', description: 'Returns economics details' })
  @ApiResponse({
    status: 200,
    description: 'The economics details',
    type: Economics,
  })
  async getEconomics(): Promise<Economics> {
    return await this.networkService.getEconomics();
  }

  @Get("/stats")
  @ApiOperation({ summary: 'Statistics details', description: 'Returns network statistics details' })
  @ApiResponse({
    status: 200,
    description: 'The network statistics',
    type: Stats,
  })
  async getStats(): Promise<Stats> {
    return await this.networkService.getStats();
  }
}
