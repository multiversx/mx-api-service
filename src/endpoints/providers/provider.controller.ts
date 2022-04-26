import { Controller, Get, HttpException, HttpStatus, Param, Query } from "@nestjs/common";
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from "@nestjs/swagger";
import { Node } from "src/endpoints/nodes/entities/node";
import { ProviderService } from "./provider.service";
import { Provider } from "./entities/provider";
import { ParseAddressPipe } from "src/utils/pipes/parse.address.pipe";

@Controller()
@ApiTags('providers')
export class ProviderController {
  constructor(private readonly providerService: ProviderService) { }

  @Get("/providers")
  @ApiOperation({ summary: 'Providers details', description: 'Returns providers informations as well as provider details for a given identity ' })
  @ApiResponse({
    status: 200,
    description: 'The providers available on the blockchain',
    type: Node,
    isArray: true,
  })
  @ApiQuery({ name: 'identity', description: 'Search by identity', required: false })
  async getProviders(
    @Query('identity') identity: string | undefined,
  ): Promise<Provider[]> {
    return await this.providerService.getProviders({ identity });
  }

  @Get('/providers/:address')
  @ApiOperation({ summary: 'Provider details', description: 'Returns provider details for a given address' })
  @ApiResponse({
    status: 200,
    description: 'Provider details',
    type: Provider,
  })
  @ApiResponse({
    status: 404,
    description: 'Provider not found',
  })
  async getProvider(@Param('address', ParseAddressPipe) address: string): Promise<Provider> {
    const provider = await this.providerService.getProvider(address);
    if (provider === undefined) {
      throw new HttpException(`Provider '${address}' not found`, HttpStatus.NOT_FOUND);
    }

    return provider;
  }
}
