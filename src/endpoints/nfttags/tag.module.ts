import { forwardRef, Module } from "@nestjs/common";
import { CommonModule } from "src/common/common.module";
import { TagService } from "./tag.service";

@Module({
  imports: [
    forwardRef(() => CommonModule),
  ],
  providers: [
    TagService,
  ],
  exports: [
    TagService,
  ],
})
export class TagModule { }
