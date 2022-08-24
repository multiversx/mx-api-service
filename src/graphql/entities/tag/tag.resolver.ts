import { Resolver } from "@nestjs/graphql";
import { Tag } from "src/endpoints/nfttags/entities/tag";
import { TagQuery } from "./tag.query";
import { TagService } from "src/endpoints/nfttags/tag.service";

@Resolver(() => Tag)
export class TagResolver extends TagQuery {
  constructor(tagServicce: TagService) {
    super(tagServicce);
  }
}
