import { Controller, DefaultValuePipe, Get, Param, Query } from "@nestjs/common";
import { ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from "@nestjs/swagger";
import { ApplicationService } from "./application.service";
import { QueryPagination } from "src/common/entities/query.pagination";
import { ApplicationFilter, UsersCountRange } from "./entities/application.filter";
import { ParseIntPipe, ParseBoolPipe, ParseAddressPipe, ParseEnumPipe, ParseArrayPipe } from "@multiversx/sdk-nestjs-common";
import { Application } from "./entities/application";

@Controller()
@ApiTags('applications')
export class ApplicationController {
  constructor(
    private readonly applicationService: ApplicationService,
  ) { }

  @Get("applications")
  @ApiOperation({ summary: 'Applications details', description: 'Returns all smart contracts available on blockchain. By default it returns 25 smart contracts' })
  @ApiOkResponse({ type: [Application] })
  @ApiQuery({ name: 'from', description: 'Number of items to skip for the result set', required: false })
  @ApiQuery({ name: 'size', description: 'Number of items to retrieve', required: false })
  @ApiQuery({ name: 'before', description: 'Before timestamp', required: false })
  @ApiQuery({ name: 'after', description: 'After timestamp', required: false })
  @ApiQuery({ name: 'withTxCount', description: 'Include transaction count', required: false, type: Boolean })
  @ApiQuery({ name: 'isVerified', description: 'Include verified applications', required: false, type: Boolean })
  @ApiQuery({ name: 'usersCountRange', description: 'Time range for users count calculation', required: false, enum: UsersCountRange })
  @ApiQuery({ name: 'addresses', description: 'Filter applications by addresses', required: false, type: [String] })
  async getApplications(
    @Query('from', new DefaultValuePipe(0), ParseIntPipe) from: number,
    @Query("size", new DefaultValuePipe(25), ParseIntPipe) size: number,
    @Query('before', ParseIntPipe) before?: number,
    @Query('after', ParseIntPipe) after?: number,
    @Query('withTxCount', new ParseBoolPipe()) withTxCount?: boolean,
    @Query('isVerified', new ParseBoolPipe()) isVerified?: boolean,
    @Query('usersCountRange', new ParseEnumPipe(UsersCountRange)) usersCountRange?: UsersCountRange,
    @Query('addresses', new ParseArrayPipe()) addresses?: string[],
  ): Promise<Application[]> {
    const applicationFilter = new ApplicationFilter({ before, after, withTxCount, isVerified, usersCountRange, addresses });
    return await this.applicationService.getApplications(
      new QueryPagination({ size, from }),
      applicationFilter
    );
  }

  @Get("applications/count")
  @ApiOperation({ summary: 'Applications count', description: 'Returns total number of smart contracts' })
  @ApiOkResponse({ type: Number })
  @ApiQuery({ name: 'before', description: 'Before timestamp', required: false })
  @ApiQuery({ name: 'after', description: 'After timestamp', required: false })
  @ApiQuery({ name: 'isVerified', description: 'Include verified applications', required: false, type: Boolean })
  async getApplicationsCount(
    @Query('before', ParseIntPipe) before?: number,
    @Query('after', ParseIntPipe) after?: number,
    @Query('isVerified', new ParseBoolPipe()) isVerified?: boolean,
  ): Promise<number> {
    const filter = new ApplicationFilter({ before, after, isVerified });

    return await this.applicationService.getApplicationsCount(filter);
  }

  @Get("applications/:address")
  @ApiOperation({ summary: 'Application details', description: 'Returns details of a smart contract' })
  @ApiOkResponse({ type: Application })
  async getApplication(
    @Param('address', ParseAddressPipe) address: string,
  ): Promise<Application> {
    return await this.applicationService.getApplication(address);
  }
}
