import { Controller, Get, HttpException, HttpStatus, Param, Query } from "@nestjs/common";
import { ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from "@nestjs/swagger";
import { ProviderService } from "./provider.service";
import { Provider } from "./entities/provider";
import { ParseAddressArrayPipe, ParseAddressPipe } from "@multiversx/sdk-nestjs";
import { ProviderFilter } from "./entities/provider.filter";

@Controller()
@ApiTags('providers')
export class ProviderController {
  constructor(private readonly providerService: ProviderService) { }

  @Get("/providers")
  @ApiOperation({ summary: 'Providers', description: 'Returns a list of all providers' })
  @ApiOkResponse({ type: [Provider] })
  @ApiQuery({ name: 'identity', description: 'Search by identity', required: false })
  @ApiQuery({ name: 'providers', description: 'Search by multiple providers address', required: false })
  async getProviders(
    @Query('identity') identity?: string,
    @Query('providers', ParseAddressArrayPipe) providers?: string[],
  ): Promise<Provider[]> {
    return await this.providerService.getProviders(new ProviderFilter({ identity, providers }));
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
}
