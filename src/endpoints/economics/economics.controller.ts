import { Controller, Get } from "@nestjs/common";
import { ApiResponse, ApiTags } from "@nestjs/swagger";
import { EconomicsService } from "./economics.service";
import { Economics } from "./entities/economics";

@Controller()
@ApiTags('network')
export class EconomicsController {
  constructor(
    private readonly economicsService: EconomicsService
  ) {}

  @Get("/economics")
  @ApiResponse({
    status: 200,
    description: 'The economics details',
    type: Economics
  })
  async getBlock(): Promise<Economics> {
    return await this.economicsService.getEconomics();
  }
}