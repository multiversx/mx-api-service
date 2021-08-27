import { Body, Controller, Delete, Get, HttpException, HttpStatus, Logger, Param, Put, Query, UseGuards } from "@nestjs/common";
import { EventPattern } from "@nestjs/microservices";
import { ApiResponse } from "@nestjs/swagger";
import { CachingService } from "src/common/caching.service";
import { JwtAdminGuard } from "src/utils/guards/jwt.admin.guard";
import { JwtAuthenticateGuard } from "src/utils/guards/jwt.authenticate.guard";
import { CacheValue } from "./entities/cache.value";

@Controller()
export class CacheController {
  private readonly logger: Logger

  constructor(
    private readonly cachingService: CachingService
  ) {
    this.logger = new Logger(CacheController.name);
  }


  @UseGuards(JwtAuthenticateGuard, JwtAdminGuard)
  @Get("/caching/:key")
  @ApiResponse({
    status: 200,
    description: 'The cache value for one key',
    type: String
  })
  @ApiResponse({
    status: 404,
    description: 'Key not found'
  })
  async getCache(@Param('key') key: string): Promise<unknown> {
    const value = await this.cachingService.getCache(key);
    if (!value) {
      throw new HttpException('Key not found', HttpStatus.BAD_REQUEST);
    }
    return JSON.stringify(value);
  }

  @UseGuards(JwtAuthenticateGuard, JwtAdminGuard)
  @Put("/caching/:key")
  @ApiResponse({
    status: 200,
    description: 'Key has been updated',
  })
  async setCache(@Param('key') key:string, @Body() cacheValue: CacheValue) {
    await this.deleteCacheKey([key]);
    await this.cachingService.setCache(key, cacheValue.value, cacheValue.ttl);
  }

  @UseGuards(JwtAuthenticateGuard, JwtAdminGuard)
  @Delete("/caching/:key")
  @ApiResponse({
    status: 200,
    description: 'Key has been deleted from cache'
  })
  @ApiResponse({
    status: 404,
    description: 'Key not found'
  })
  async delCache(@Param('key') key: string) {
    const value = await this.cachingService.getCache(key);
    if (!value) {
      throw new HttpException('Key not found', HttpStatus.BAD_REQUEST);
    }
    await this.deleteCacheKey([key]);
  }

  @UseGuards(JwtAuthenticateGuard, JwtAdminGuard)
  @Get("/caching")
  async getKeys(
    @Query('keys') keys: string | undefined,
  ): Promise<string[]> {
    return await this.cachingService.getKeys(keys);
  }

  @EventPattern('deleteCacheKeys')
  async deleteCacheKey(keys: string[]) {
    this.logger.log(`Deleting cache keys ${keys}`);

    for (let key of keys) {
      await this.cachingService.deleteInCacheLocal(key);
    }
  }
}