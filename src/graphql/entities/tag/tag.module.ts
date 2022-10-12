import { Module } from "@nestjs/common";
import { TagModule as InternalTagModule } from "src/endpoints/nfttags/tag.module";
import { TagResolver } from "./tag.resolver";

@Module({
  imports: [InternalTagModule],
  providers: [TagResolver],
})
export class TagModule { }
