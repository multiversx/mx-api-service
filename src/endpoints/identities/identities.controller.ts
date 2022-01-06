import { Controller, Get, HttpException, HttpStatus, Param, Query } from "@nestjs/common";
import { ApiQuery, ApiResponse, ApiTags } from "@nestjs/swagger";
import { ParseArrayPipe } from "src/utils/pipes/parse.array.pipe";
import { Identity } from "./entities/identity";
import { IdentitiesService } from "./identities.service";

@Controller()
@ApiTags('identities')
export class IdentitiesController {
  constructor(private readonly identitiesService: IdentitiesService) { }

  @Get("/identities")
  @ApiResponse({
    status: 200,
    description: 'The identities available on the blockchain',
    type: Identity,
    isArray: true,
  })
  @ApiQuery({ name: 'identities', description: 'Filter by comma-separated list of identities', required: false })
  async getIdentities(
    @Query('identities', ParseArrayPipe) identities: string[] = []
  ): Promise<Identity[]> {
    return await this.identitiesService.getIdentities(identities);
  }

  @Get('/identities/:identifier')
  @ApiResponse({
    status: 200,
    description: 'Identity details',
    type: Identity,
  })
  @ApiResponse({
    status: 404,
    description: 'Identity not found',
  })
  async getIdentity(@Param('identifier') identifier: string): Promise<Identity> {
    const identity = await this.identitiesService.getIdentity(identifier);
    if (identity === undefined) {
      throw new HttpException('Identity not found', HttpStatus.NOT_FOUND);
    }

    return identity;
  }
}