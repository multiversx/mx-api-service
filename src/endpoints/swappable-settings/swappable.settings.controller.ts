import { JwtAdminGuard, JwtAuthenticateGuard } from "@elrondnetwork/erdnest";
import { Body, Controller, Delete, Get, HttpException, HttpStatus, Param, Put, UseGuards } from "@nestjs/common";
import { SwappableSettingsService } from "./swappable.settings.service";
import { ApiExcludeController, ApiResponse } from "@nestjs/swagger";

@Controller('settings')
@ApiExcludeController()
export class SwappableSettingsController {
  constructor(
    private readonly swappableSettingsService: SwappableSettingsService
  ) { }

  @UseGuards(JwtAuthenticateGuard, JwtAdminGuard)
  @Put("/")
  @ApiResponse({
    status: 200,
    description: 'Key changed',
    type: String,
  })
  @ApiResponse({
    status: 404,
    description: 'Key not found',
  })
  async changeOrCreateKey(@Body('key') identifier: string, @Body('value') value: boolean): Promise<unknown> {
    return await this.swappableSettingsService.setValue(identifier, value);
  }

  @UseGuards(JwtAuthenticateGuard, JwtAdminGuard)
  @Get("/:key")
  @ApiResponse({
    status: 200,
    description: 'The config value for one key',
    type: String,
  })
  @ApiResponse({
    status: 404,
    description: 'Key not found',
  })
  async getKey(@Param('key') identifier: string): Promise<unknown> {
    const value = await this.swappableSettingsService.getValue(identifier);
    if (!value) {
      throw new HttpException('Key not found', HttpStatus.NOT_FOUND);
    }
    return value;
  }


  @UseGuards(JwtAuthenticateGuard, JwtAdminGuard)
  @Delete("/:key")
  @ApiResponse({
    status: 200,
    description: 'Key changed',
    type: String,
  })
  @ApiResponse({
    status: 404,
    description: 'Key not found',
  })
  async deleteKey(@Param('key') identifier: string): Promise<unknown> {
    const value = await this.swappableSettingsService.deleteKey(identifier);

    if (!value) {
      throw new HttpException('Key not found', HttpStatus.NOT_FOUND);
    }
    return '';
  }
}
