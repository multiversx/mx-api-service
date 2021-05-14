import { Controller, Get } from '@nestjs/common';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { Constants } from './entities/Constants';
import { NetworkService } from './network.service';

@Controller()
@ApiTags('network')
export class NetworkController {
  constructor(private readonly networkService: NetworkService) {}

  @Get("/constants")
  @ApiResponse({
    status: 200,
    description: 'The constants',
    type: Constants
  })
  getConstants(): Promise<Constants> {
    return this.networkService.getConstants();
  }
}
