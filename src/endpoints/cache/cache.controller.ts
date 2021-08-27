import { Body, Controller, Delete, Get, HttpException, HttpStatus, Logger, Param, Put, Query } from "@nestjs/common";
import { EventPattern } from "@nestjs/microservices";
import { ApiResponse } from "@nestjs/swagger";
import { CachingService } from "src/common/caching.service";
import { CacheValue } from "./entities/cache.value";

@Controller()
export class CacheController {
  private readonly logger: Logger

  constructor(
    private readonly cachingService: CachingService
  ) {
    this.logger = new Logger(CacheController.name);
  }


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

  @Put("/caching/:key")
  @ApiResponse({
    status: 200,
    description: 'Key has been updated',
  })
  @ApiResponse({
    status: 404,
    description: 'Key not found'
  })
  async updateCache(@Param('key') key:string, @Body() cacheValue: CacheValue) {
    const value = await this.cachingService.getCache(key);
    if (!value) {
      throw new HttpException('Key not found', HttpStatus.BAD_REQUEST);
    }

    await this.cachingService.setCache(key, cacheValue.value, cacheValue.ttl);
  }

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
    await this.cachingService.deleteInCache(key);
  }

  @Get("/caching")
  async getKeys(
    @Query('keys') keys: string | undefined,
  ): Promise<string[]> {
    const keysWithPattern = [];
    if (keys) {
      const allKeys = await caches.keys();
      for (let key of allKeys) {
        if (key.includes(keys)) {
          keysWithPattern.push(key);
        }
      }
    }
    
    return keysWithPattern;
  }

  @EventPattern('deleteCacheKeys')
  async deleteCacheKey(keys: string[]) {
    this.logger.log(`Deleting cache keys ${keys}`);

    for (let key of keys) {
      await this.cachingService.deleteInCacheLocal(key);
    }
  }
}