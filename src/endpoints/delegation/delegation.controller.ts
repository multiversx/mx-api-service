import { Controller, Get } from "@nestjs/common";
import { ApiResponse, ApiTags } from "@nestjs/swagger";
import { DelegationService } from "./delegation.service";
import { Delegation } from "./entities/delegation";

@Controller()
@ApiTags('delegation')
export class DelegationController {
  constructor(
    private readonly delegationService: DelegationService,
  ) { }

  @Get("/delegation")
  @ApiResponse({
    status: 200,
    description: 'The delegation details',
    type: Delegation,
  })
  async getDelegationDetails(): Promise<Delegation> {
    return await this.delegationService.getDelegation();
  }
}