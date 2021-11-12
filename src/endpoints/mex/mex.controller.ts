import { Controller, Get, HttpException, HttpStatus, Param } from "@nestjs/common";
import { ApiResponse, ApiTags } from "@nestjs/swagger";
import { ParseAddressPipe } from "src/utils/pipes/parse.address.pipe";
import { MexWeek } from "./entities/mex.week";
import { MexService } from "./mex.service";

@Controller()
@ApiTags('mex')
export class MexController {
  constructor(private readonly mexService: MexService) {}

  @Get('/mex/:address')
  @ApiResponse({
    status: 200,
    description: 'Mex details for address',
    type: MexWeek,
  })
  @ApiResponse({
    status: 404,
    description: 'Address not found'
  })
  async getMexForAddress(@Param('address', ParseAddressPipe) address: string): Promise<MexWeek[]> {
    let mex = await this.mexService.getMexForAddress(address);
    if (!mex) {
      throw new HttpException('Address not found', HttpStatus.NOT_FOUND);
    }

    return mex;
  }
}