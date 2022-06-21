import { Controller, DefaultValuePipe, Get, HttpException, HttpStatus, Param, ParseIntPipe, Query } from '@nestjs/common';
import { ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Tag } from './entities/tag';
import { TagService } from './tag.service';


@Controller()
@ApiTags('tags')
export class TagController {
  constructor(
    private readonly nftTagsService: TagService,
  ) { }

  @Get("/tags")
  @ApiOperation({ summary: 'NFT Tags', description: 'Returns all distinct NFT tags' })
  @ApiOkResponse({ type: [Tag] })
  @ApiQuery({ name: 'from', description: 'Number of items to skip for the result set', required: false })
  @ApiQuery({ name: 'size', description: 'Number of items to retrieve', required: false })
  @ApiQuery({ name: 'search', description: 'Search by tag name', required: false })
  async getTags(
    @Query('from', new DefaultValuePipe(0), ParseIntPipe) from: number,
    @Query("size", new DefaultValuePipe(25), ParseIntPipe) size: number,
    @Query('search') search: string | undefined,
  ): Promise<Tag[]> {
    return await this.nftTagsService.getNftTags({ from, size }, search);
  }

  @Get("/tags/count")
  @ApiOperation({ summary: 'Total number of NFT Tags', description: 'Returns total number of distinct NFT Tags available on blockchain' })
  @ApiQuery({ name: 'search', description: 'Search by tag name', required: false })
  @ApiOkResponse({ type: Number })
  async getTagCount(
    @Query('search') search: string | undefined,
  ): Promise<number> {
    return await this.nftTagsService.getNftTagCount(search);
  }

  @Get("/tags/:tag")
  @ApiOperation({ summary: 'Tag details', description: 'Return NFT tag details' })
  @ApiOkResponse({ type: Tag })
  @ApiNotFoundResponse({ description: 'Nft tag not found' })
  async getTagDetails(@Param('tag') tag: string): Promise<Tag> {
    try {
      return await this.nftTagsService.getNftTag(tag);
    } catch {
      throw new HttpException('Nft tag not found', HttpStatus.NOT_FOUND);
    }
  }
}
