import { Controller, Get } from "@nestjs/common";
import { ApiResponse, ApiTags } from "@nestjs/swagger";
import { StakeService } from "./stake.service";

@Controller()
@ApiTags('stake')
export class StakeController {
  constructor(
    private readonly stakeService: StakeService
  ) { }

  @Get('/stake')
  @ApiResponse({
    status: 200,
    description: 'Stake details',
  })
  async getGlobalStake() {
    return await this.stakeService.getGlobalStake();
  }
}
