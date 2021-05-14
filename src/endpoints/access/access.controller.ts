import { Controller, Get } from "@nestjs/common";
import { ApiResponse, ApiTags } from "@nestjs/swagger";
import { AccessService } from "./access.service";

@Controller()
@ApiTags('access')
export class AccessController {
  constructor(
    private readonly accessService: AccessService
  ) {}

  @Get("/access")
  @ApiResponse({
    status: 200,
  })
  getAccess(): string {
    return this.accessService.getAccess();
  }
}