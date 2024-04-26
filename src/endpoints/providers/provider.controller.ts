import { Controller, Get, HttpException, HttpStatus, Param, Query, Res } from "@nestjs/common";
import { ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from "@nestjs/swagger";
import { ProviderService } from "./provider.service";
import { Provider } from "./entities/provider";
import { ParseAddressArrayPipe, ParseAddressPipe, ParseBoolPipe } from "@multiversx/sdk-nestjs-common";
import { ProviderFilter } from "./entities/provider.filter";
import { Response } from "express";
import { ProviderQueryOptions } from "./entities/provider.query.options";

@Controller()
@ApiTags('providers')
export class ProviderController {
  constructor(private readonly providerService: ProviderService) { }

  @Get("/providers")
  @ApiOperation({ summary: 'Providers', description: 'Returns a list of all providers' })
  @ApiOkResponse({ type: [Provider] })
  @ApiQuery({ name: 'identity', description: 'Search by identity', required: false })
  @ApiQuery({ name: 'owner', description: 'Search by owner', required: false })
  @ApiQuery({ name: 'providers', description: 'Search by multiple providers address', required: false })
  @ApiQuery({ name: 'withIdentityInfo', description: 'Returns identity data for providers', required: false })
  @ApiQuery({ name: 'withLatestInfo', description: 'Returns providers details with latest info', required: false })
  async getProviders(
    @Query('identity') identity?: string,
    @Query('owner', ParseAddressPipe) owner?: string,
    @Query('providers', ParseAddressArrayPipe) providers?: string[],
    @Query('withIdentityInfo', new ParseBoolPipe) withIdentityInfo?: boolean,
    @Query('withLatestInfo', new ParseBoolPipe) withLatestInfo?: boolean,
  ): Promise<Provider[]> {
    const options = ProviderQueryOptions.applyDefaultOptions(owner, { withIdentityInfo, withLatestInfo });

    return await this.providerService.getProviders(
      new ProviderFilter({ identity, providers, owner }), options);
  }

  @Get('/providers/:address')
  @ApiOperation({ summary: 'Provider', description: 'Returns provider details for a given address' })
  @ApiOkResponse({ type: Provider })
  @ApiNotFoundResponse({ description: 'Provider not found' })
  async getProvider(@Param('address', ParseAddressPipe) address: string): Promise<Provider> {
    const provider = await this.providerService.getProvider(address);
    if (provider === undefined) {
      throw new HttpException(`Provider '${address}' not found`, HttpStatus.NOT_FOUND);
    }

    return provider;
  }

  @Get('/providers/:address/avatar')
  @ApiOperation({ summary: 'Provider avatar', description: 'Returns the avatar for a specific provider address' })
  @ApiNotFoundResponse({ description: 'Provider avatar not found' })
  async getIdentityAvatar(
    @Param('address') address: string,
    @Res() response: Response
  ): Promise<void> {
    const url = await this.providerService.getProviderAvatar(address);

    if (!url) {
      throw new HttpException('Provider avatar not found', HttpStatus.NOT_FOUND);
    }
    response.redirect(url);
  }
}
