import { Body, Controller, Delete, Get, HttpException, HttpStatus, Inject, Param, Put, Query, UseGuards } from "@nestjs/common";
import { ClientProxy } from "@nestjs/microservices";
import { ApiResponse } from "@nestjs/swagger";
import { CachingService } from "src/common/caching/caching.service";
import { JwtAdminGuard } from "src/utils/guards/jwt.admin.guard";
import { JwtAuthenticateGuard } from "src/utils/guards/jwt.authenticate.guard";
import { CacheValue } from "./entities/cache.value";

@Controller()
export class CacheController {

  constructor(
    private readonly cachingService: CachingService,
    @Inject('PUBSUB_SERVICE') private clientProxy: ClientProxy,
  ) { }


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
    const value = await this.cachingService.getCacheRemote(key);
    if (!value) {
      throw new HttpException('Key not found', HttpStatus.NOT_FOUND);
    }
    return JSON.stringify(value);
  }

  @UseGuards(JwtAuthenticateGuard, JwtAdminGuard)
  @Put("/caching/:key")
  @ApiResponse({
    status: 200,
    description: 'Key has been updated',
  })
  async setCache(@Param('key') key: string, @Body() cacheValue: CacheValue) {
    await this.cachingService.setCacheRemote(key, cacheValue.value, cacheValue.ttl);
    this.clientProxy.emit('deleteCacheKeys', [ key ]);
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
    const keys = await this.cachingService.deleteInCache(key);
    this.clientProxy.emit('deleteCacheKeys', keys);
  }

  @UseGuards(JwtAuthenticateGuard, JwtAdminGuard)
  @Get("/caching")
  async getKeys(
    @Query('keys') keys: string | undefined,
  ): Promise<string[]> {
    return await this.cachingService.getKeys(keys);
  }
}