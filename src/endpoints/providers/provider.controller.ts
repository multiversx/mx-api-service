import { Controller, DefaultValuePipe, Get, HttpException, HttpStatus, Param, ParseIntPipe, Query } from "@nestjs/common";
import { ApiQuery, ApiResponse, ApiTags } from "@nestjs/swagger";
import { Node } from "src/endpoints/nodes/entities/node";
import { ProviderService } from "./provider.service";
import { Provider } from "./entities/provider";
import { ParseAddressPipe } from "src/utils/pipes/parse.address.pipe";

@Controller()
@ApiTags('providers')
export class ProviderController {
	constructor(private readonly providerService: ProviderService) {}

	@Get("/providers")
	@ApiResponse({
		status: 200,
		description: 'The providers available on the blockchain',
		type: Node,
		isArray: true,
	})
	@ApiQuery({ name: 'from', description: 'Numer of items to skip for the result set', required: false })
	@ApiQuery({ name: 'size', description: 'Number of items to retrieve', required: false })
	@ApiQuery({ name: 'identity', description: 'Search by identity', required: false })
	async getProviders(
		@Query('from', new DefaultValuePipe(0), ParseIntPipe) from: number, 
		@Query('size', new DefaultValuePipe(25), ParseIntPipe) size: number,
		@Query('identity') identity: string | undefined,
	): Promise<Provider[]> {
		return await this.providerService.getProviders({ from, size, identity });
	}

  @Get('/providers/:address')
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