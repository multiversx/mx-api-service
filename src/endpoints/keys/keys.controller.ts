import { ParseBlsHashPipe } from "@multiversx/sdk-nestjs-common";
import { Controller, Get, HttpException, HttpStatus, Param } from "@nestjs/common";
import { ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiParam, ApiTags } from "@nestjs/swagger";
import { KeyUnbondPeriod } from "./entities/key.unbond.period";
import { KeysService } from "./keys.service";

@Controller()
@ApiTags('keys')
export class KeysController {
  constructor(private readonly keysService: KeysService) { }

  @Get("/keys/:key/unbond-period")
  @ApiOperation({ summary: 'Unbonding period', description: 'Returns remaining unbonding period for a given bls key' })
  @ApiParam({ name: 'key', description: 'The BLS key of the node', required: true })
  @ApiOkResponse({ type: KeyUnbondPeriod })
  @ApiNotFoundResponse({ description: 'Key not found' })
  async getKeyUnbondPeriod(
    @Param('key', ParseBlsHashPipe) key: string
  ): Promise<KeyUnbondPeriod> {
    const result = await this.keysService.getKeyUnbondPeriod(key);
    if (!result) {
      throw new HttpException('Key not found', HttpStatus.NOT_FOUND);
    }
    return result;
  }
}

