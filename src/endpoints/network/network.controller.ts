import { Controller, Get } from '@nestjs/common';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { Constants } from './entities/constants';
import { Economics } from './entities/economics';
import { NetworkService } from './network.service';

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
  async getBlock(): Promise<Economics> {
    return await this.networkService.getEconomics();
  }
}
