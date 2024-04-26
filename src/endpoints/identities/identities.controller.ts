import { ParseArrayPipe, ParseEnumPipe } from "@multiversx/sdk-nestjs-common";
import { Controller, Get, HttpException, HttpStatus, Param, Query, Res } from "@nestjs/common";
import { ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from "@nestjs/swagger";
import { Identity } from "./entities/identity";
import { IdentitiesService } from "./identities.service";
import { Response } from "express";
import { IdentitySortCriteria } from "./entities/identity.sort.criteria";

@Controller()
@ApiTags('identities')
export class IdentitiesController {
  constructor(private readonly identitiesService: IdentitiesService) { }

  @Get("/identities")
  @ApiOperation({ summary: 'Identities', description: 'List of all node identities, used to group nodes by the same entity. "Free-floating" nodes that do not belong to any identity will also be returned' })
  @ApiOkResponse({ type: [Identity] })
  @ApiQuery({ name: 'identities', description: 'Filter by comma-separated list of identities', required: false })
  @ApiQuery({ name: 'sort', description: 'Sort criteria (validators)', required: false, enum: IdentitySortCriteria })
  async getIdentities(
    @Query('identities', ParseArrayPipe) identities: string[] = [],
    @Query('sort', new ParseEnumPipe(IdentitySortCriteria)) sort?: IdentitySortCriteria,
  ): Promise<Identity[]> {
    return await this.identitiesService.getIdentities(identities, sort);
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

  @Get('/identities/:identifier/avatar')
  @ApiOperation({ summary: 'Identity avatar', description: 'Returns the avatar of a specific identity' })
  @ApiNotFoundResponse({ description: 'Identity not found' })
  async getIdentityAvatar(
    @Param('identifier') identifier: string,
    @Res() response: Response
  ): Promise<void> {
    const url = await this.identitiesService.getIdentityAvatar(identifier);

    if (!url) {
      throw new HttpException('Identity avatar not found', HttpStatus.NOT_FOUND);
    }
    response.redirect(url);
  }
}
