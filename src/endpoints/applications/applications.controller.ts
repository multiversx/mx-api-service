import { Controller, DefaultValuePipe, Get, Param, ParseIntPipe, Query } from "@nestjs/common";
import { ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from "@nestjs/swagger";
import { SortOrder } from "src/common/entities/sort.order";
import { QueryPagination } from "src/common/entities/query.pagination";
import { ApplicationsService } from "./applications.service";
import { Applications } from "./entities/applications";
import { ApplicationFilter, UsersCountRange } from "./entities/application.filter";
import { ApplicationSort } from "./entities/application.sort";
import { ParseAddressArrayPipe, ParseEnumPipe, ParseBoolPipe, ParseAddressPipe } from "@multiversx/sdk-nestjs-common";

@Controller()
@ApiTags('applications')
export class ApplicationsController {
  constructor(
    private readonly applicationsService: ApplicationsService,
  ) { }

  @Get('/applications')
  @ApiOperation({ summary: 'Smart Contract Applications', description: 'Returns list of smart contract applications' })
  @ApiOkResponse({ type: [Applications] })
  @ApiQuery({ name: 'from', description: 'Number of items to skip for the result set', required: false })
  @ApiQuery({ name: 'size', description: 'Number of items to retrieve', required: false })
  @ApiQuery({ name: 'search', description: 'Search by application address', required: false })
  @ApiQuery({ name: 'addresses', description: 'Filter by a comma-separated list of addresses', required: false })
  @ApiQuery({ name: 'ownerAddress', description: 'Filter by owner address', required: false })
  @ApiQuery({ name: 'sort', description: 'Sort criteria', required: false, enum: ApplicationSort })
  @ApiQuery({ name: 'order', description: 'Sort order (asc/desc)', required: false, enum: SortOrder })
  @ApiQuery({ name: 'usersCountRange', description: 'Filter by users count range', required: false, enum: UsersCountRange })
  @ApiQuery({ name: 'feesRange', description: 'Filter by fees range', required: false, enum: UsersCountRange })
  @ApiQuery({ name: 'isVerified', description: 'Filter by verified applications', required: false })
  @ApiQuery({ name: 'hasAssets', description: 'Filter by applications that have assets', required: false })
  async getApplications(
    @Query('from', new DefaultValuePipe(0), ParseIntPipe) from: number,
    @Query('size', new DefaultValuePipe(25), ParseIntPipe) size: number,
    @Query('search') search?: string,
    @Query('addresses', ParseAddressArrayPipe) addresses?: string[],
    @Query('ownerAddress') ownerAddress?: string,
    @Query('sort', new ParseEnumPipe(ApplicationSort)) sort?: ApplicationSort,
    @Query('order', new ParseEnumPipe(SortOrder)) order?: SortOrder,
    @Query('usersCountRange', new ParseEnumPipe(UsersCountRange)) usersCountRange?: UsersCountRange,
    @Query('feesRange', new ParseEnumPipe(UsersCountRange)) feesRange?: UsersCountRange,
    @Query('isVerified', ParseBoolPipe) isVerified?: boolean,
    @Query('hasAssets', ParseBoolPipe) hasAssets?: boolean,
  ): Promise<Applications[]> {
    const filter = new ApplicationFilter({
      search,
      addresses,
      ownerAddress,
      sort,
      order,
      usersCountRange,
      feesRange,
      isVerified,
      hasAssets,
    });

    filter.validate();

    return await this.applicationsService.getApplications(new QueryPagination({ from, size }), filter);
  }

  @Get('/applications/count')
  @ApiOperation({ summary: 'Smart Contract Applications Count', description: 'Returns total number of smart contract applications' })
  @ApiOkResponse({ type: Number })
  @ApiQuery({ name: 'search', description: 'Search by application address', required: false })
  @ApiQuery({ name: 'addresses', description: 'Filter by a comma-separated list of addresses', required: false })
  @ApiQuery({ name: 'ownerAddress', description: 'Filter by owner address', required: false })
  @ApiQuery({ name: 'isVerified', description: 'Filter by verified applications', required: false })
  @ApiQuery({ name: 'hasAssets', description: 'Filter by applications that have assets', required: false })
  async getApplicationsCount(
    @Query('search') search?: string,
    @Query('addresses', ParseAddressArrayPipe) addresses?: string[],
    @Query('ownerAddress') ownerAddress?: string,
    @Query('isVerified', ParseBoolPipe) isVerified?: boolean,
    @Query('hasAssets', ParseBoolPipe) hasAssets?: boolean,
  ): Promise<number> {
    const filter = new ApplicationFilter({
      search,
      addresses,
      ownerAddress,
      isVerified,
      hasAssets,
    });

    filter.validate();

    return await this.applicationsService.getApplicationsCount(filter);
  }

  @Get('/applications/:address')
  @ApiOperation({ summary: 'Smart Contract Application', description: 'Returns a smart contract application' })
  @ApiOkResponse({ type: Applications })
  @ApiQuery({ name: 'usersCountRange', description: 'Range for users count calculation', required: false, enum: UsersCountRange })
  @ApiQuery({ name: 'feesRange', description: 'Range for fees captured calculation', required: false, enum: UsersCountRange })
  async getApplication(
    @Param('address', ParseAddressPipe) address: string,
    @Query('usersCountRange', new ParseEnumPipe(UsersCountRange)) usersCountRange?: UsersCountRange,
    @Query('feesRange', new ParseEnumPipe(UsersCountRange)) feesRange?: UsersCountRange,
  ): Promise<Applications> {
    return await this.applicationsService.getApplication(address, usersCountRange, feesRange);
  }
}
