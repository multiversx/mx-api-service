import { Controller, Get } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { StakeService } from "./stake.service";

@Controller()
@ApiTags('stake')
export class StakeController {
  constructor(
    private readonly stakeService: StakeService
  ) { }

  @Get('/stake')
  @ApiOperation({ summary: 'Stake details', description: 'Returns stake informations as well as total/active validators and nodes queue size ' })
  @ApiResponse({
    status: 200,
    description: 'Stake details',
  })
  async getGlobalStake() {
    return await this.stakeService.getGlobalStake();
  }
}
