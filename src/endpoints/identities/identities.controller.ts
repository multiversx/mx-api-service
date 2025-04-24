import { ParseArrayPipe, ParseEnumArrayPipe } from "@multiversx/sdk-nestjs-common";
import { Controller, DefaultValuePipe, Get, HttpException, HttpStatus, Param, ParseIntPipe, Query, Res } from "@nestjs/common";
import { ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from "@nestjs/swagger";
import { Identity } from "./entities/identity";
import { IdentitiesService } from "./identities.service";
import { Response } from "express";
import { IdentitySortCriteria } from "./entities/identity.sort.criteria";
import { QueryPagination } from "src/common/entities/query.pagination";

@Controller()
@ApiTags('identities')
export class IdentitiesController {
  constructor(private readonly identitiesService: IdentitiesService) { }

  @Get("/identities")
  @ApiOperation({ summary: 'Identities', description: 'List of all node identities, used to group nodes by the same entity. "Free-floating" nodes that do not belong to any identity will also be returned' })
  @ApiOkResponse({ type: [Identity] })
  @ApiQuery({ name: 'from', description: 'Number of items to skip for the result set', required: false })
  @ApiQuery({ name: 'size', description: 'Number of items to retrieve', required: false })
  @ApiQuery({ name: 'identities', description: 'Filter by comma-separated list of identities', required: false })
  @ApiQuery({ name: 'sort', description: 'Sort criteria (comma-separated list: validators,stake,locked)', required: false })
  async getIdentities(
    @Query('from', new DefaultValuePipe(0), ParseIntPipe) from: number,
    @Query('size', new DefaultValuePipe(10000), ParseIntPipe) size: number,
    @Query('identities', ParseArrayPipe) identities: string[] = [],
    @Query('sort', new ParseEnumArrayPipe(IdentitySortCriteria)) sort?: IdentitySortCriteria[],
  ): Promise<Identity[]> {
    return await this.identitiesService.getIdentities(new QueryPagination({ from, size }), identities, sort);
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
