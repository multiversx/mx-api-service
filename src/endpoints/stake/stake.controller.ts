import { Controller, Get } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { GlobalStake } from "./entities/global.stake";
import { StakeService } from "./stake.service";

@Controller()
@ApiTags('stake')
export class StakeController {
  constructor(
    private readonly stakeService: StakeService
  ) { }

  @Get('/stake')
  @ApiOperation({ summary: 'Stake', description: 'Returns general staking information' })
  @ApiResponse({
    status: 200,
    type: GlobalStake,
  })
  async getGlobalStake() {
    return await this.stakeService.getGlobalStake();
  }
}
