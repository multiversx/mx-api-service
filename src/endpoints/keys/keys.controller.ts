import { Controller, Get, HttpException, HttpStatus, Param } from "@nestjs/common";
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from "@nestjs/swagger";
import { ParseBlsHashPipe } from "src/utils/pipes/parse.bls.hash.pipe";
import { KeyUnbondPeriod } from "./entities/key.unbond.period";
import { KeysService } from "./keys.service";

@Controller()
@ApiTags('keys')
export class KeysController {
  constructor(private readonly keysService: KeysService) { }

  @Get("/keys/:key/unbond-period")
  @ApiOperation({ summary: 'Unbonding details', description: 'Returns unbonding period remaining for a given bls key' })
  @ApiResponse({
    status: 200,
    description: 'The unbonding period remaining for the given BLS key',
    type: KeyUnbondPeriod,
  })
  @ApiQuery({ name: 'key', description: 'The BLS key of the node', required: true })
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
