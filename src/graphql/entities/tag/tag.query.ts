import { Args, Float, Resolver, Query } from "@nestjs/graphql";
import { TagService } from "src/endpoints/nfttags/tag.service";
import { Tag } from "src/endpoints/nfttags/entities/tag";
import { GetTagsInput } from "./tag.input";

@Resolver()
export class TagQuery {
  constructor(protected readonly tagService: TagService) { }

  @Query(() => [Tag], { name: "tags", description: "Retrieve all tags for the given input." })
  public async getTags(@Args("input", { description: "Input to retrieve the given tags for." }) input: GetTagsInput): Promise<Tag[]> {
    return await this.tagService.getNftTags(GetTagsInput.resolve(input));
  }

  @Query(() => Float, { name: "tagsCount", description: "Retrieve all tags count." })
  public async getTagsCount(): Promise<number> {
    return await this.tagService.getNftTagCount();
  }
}
