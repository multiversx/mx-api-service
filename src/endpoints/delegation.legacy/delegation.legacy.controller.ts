import { Controller, Get } from "@nestjs/common";
import { ApiResponse, ApiTags } from "@nestjs/swagger";
import { DelegationLegacyService } from "./delegation.legacy.service";
import { DelegationLegacy } from "./entities/delegation.legacy";

@Controller()
@ApiTags('delegation')
export class DelegationLegacyController {
  constructor(private readonly delegationLegacyService: DelegationLegacyService) {}

  @Get("/delegation-legacy")
  @ApiResponse({
    status: 200,
    description: 'The delegation legacy details',
    type: DelegationLegacy
  })
  async getBlock(): Promise<DelegationLegacy> {
    return await this.delegationLegacyService.getDelegation();
  }
}