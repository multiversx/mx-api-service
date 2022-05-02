import { Controller, Get } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { DelegationService } from "./delegation.service";
import { Delegation } from "./entities/delegation";

@Controller()
@ApiTags('delegation')
export class DelegationController {
  constructor(
    private readonly delegationService: DelegationService,
  ) { }

  @Get("/delegation")
  @ApiOperation({ summary: 'Delegation statistics', description: 'Returns delegation staking contract information' })
  @ApiResponse({
    status: 200,
    type: Delegation,
  })
  async getDelegationDetails(): Promise<Delegation> {
    return await this.delegationService.getDelegation();
  }
}
