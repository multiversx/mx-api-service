import { ParseArrayPipe } from "@elrondnetwork/erdnest";
import { Controller, Get, HttpException, HttpStatus, Param, Query } from "@nestjs/common";
import { ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from "@nestjs/swagger";
import { Identity } from "./entities/identity";
import { IdentitiesService } from "./identities.service";

@Controller()
@ApiTags('identities')
export class IdentitiesController {
  constructor(private readonly identitiesService: IdentitiesService) { }

  @Get("/identities")
  @ApiOperation({ summary: 'Identities', description: 'List of all node identities, used to group nodes by the same entity. "Free-floating" nodes that do not belong to any identity will also be returned' })
  @ApiOkResponse({ type: [Identity] })
  @ApiQuery({ name: 'identities', description: 'Filter by comma-separated list of identities', required: false })
  async getIdentities(
    @Query('identities', ParseArrayPipe) identities: string[] = []
  ): Promise<Identity[]> {
    return await this.identitiesService.getIdentities(identities);
  }

  @Get('/identities/:identifier')
  @ApiOperation({ summary: 'Identity details', description: 'Returns the details of a single identity' })
  @ApiOkResponse({ type: Identity })
  @ApiNotFoundResponse({ description: 'Identity not found' })
  async getIdentity(@Param('identifier') identifier: string): Promise<Identity> {
    const identity = await this.identitiesService.getIdentity(identifier);
    if (identity === undefined) {
      throw new HttpException('Identity not found', HttpStatus.NOT_FOUND);
    }

    return identity;
  }
}
