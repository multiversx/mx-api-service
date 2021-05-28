import { Controller, DefaultValuePipe, Get, HttpException, HttpStatus, Param, ParseIntPipe, Query } from "@nestjs/common";
import { ApiQuery, ApiResponse, ApiTags } from "@nestjs/swagger";
import { Identity } from "./entities/identity";
import { IdentitiesService } from "./identities.service";

@Controller()
@ApiTags('identities')
export class IdentitiesController {
	constructor(private readonly identitiesService: IdentitiesService) {}

	@Get("/identities")
	@ApiResponse({
		status: 200,
		description: 'The identities available on the blockchain',
		type: Identity,
		isArray: true
	})
	@ApiQuery({ name: 'from', description: 'Numer of items to skip for the result set', required: false })
	@ApiQuery({ name: 'size', description: 'Number of items to retrieve', required: false })
	async getIdentities(
		@Query('from', new DefaultValuePipe(0), ParseIntPipe) from: number, 
		@Query('size', new DefaultValuePipe(25), ParseIntPipe) size: number,
	): Promise<Identity[]> {
		return await this.identitiesService.getIdentities(from, size);
	}

  @Get('/identities/:identifier')
  @ApiResponse({
    status: 200,
    description: 'Identity details',
    type: Identity
  })
  @ApiResponse({
    status: 404,
    description: 'Identity not found'
  })
  async getIdentity(@Param('identifier') identifier: string): Promise<Identity> {
    let identity = await this.identitiesService.getIdentity(identifier);
    if (identity === undefined) {
      throw new HttpException('Identity not found', HttpStatus.NOT_FOUND);
    }

    return identity;
  }
}