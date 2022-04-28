import { Controller, Get } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { DelegationLegacyService } from "./delegation.legacy.service";
import { DelegationLegacy } from "./entities/delegation.legacy";

@Controller()
@ApiTags('delegation')
export class DelegationLegacyController {
  constructor(private readonly delegationLegacyService: DelegationLegacyService) { }

  @Get("/delegation-legacy")
  @ApiOperation({ summary: 'Delegation-legacy details', description: 'Returns delegation legacy details as well as total withdraw/unstake/waiting stake, total deferred payment stake and total number of users' })
  @ApiResponse({
    status: 200,
    type: DelegationLegacy,
  })
  async getBlock(): Promise<DelegationLegacy> {
    return await this.delegationLegacyService.getDelegation();
  }
}
