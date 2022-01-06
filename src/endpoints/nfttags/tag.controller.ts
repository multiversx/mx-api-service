import { Controller, DefaultValuePipe, Get, HttpException, HttpStatus, Param, ParseIntPipe, Query } from '@nestjs/common';
import { ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Tag } from './entities/tag';
import { TagService } from './tag.service';


@Controller()
@ApiTags('tags')
export class TagController {
  constructor(
    private readonly nftTagsService: TagService,
  ) { }

  @Get("/tags")
  @ApiResponse({
    status: 200,
    description: 'The nft tags available',
    type: Tag,
    isArray: true,
  })
  @ApiQuery({ name: 'from', description: 'Numer of items to skip for the result set', required: false })
  @ApiQuery({ name: 'size', description: 'Number of items to retrieve', required: false })
  getAccounts(
    @Query('from', new DefaultValuePipe(0), ParseIntPipe) from: number,
    @Query("size", new DefaultValuePipe(25), ParseIntPipe) size: number
  ): Promise<Tag[]> {
    return this.nftTagsService.getNftTags({ from, size });
  }

  @Get("/tags/:tag")
  @ApiResponse({
    status: 200,
    description: 'The details of a given nft tag',
    type: Tag,
  })
  @ApiResponse({
    status: 404,
    description: 'Nft tag not found',
  })
  async getAccountDetails(@Param('tag') tag: string): Promise<Tag> {
    try {
      return await this.nftTagsService.getNftTag(tag);
    } catch {
      throw new HttpException('Nft tag not found', HttpStatus.NOT_FOUND);
    }
  }
}
