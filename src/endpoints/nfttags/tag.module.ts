import { forwardRef, Module } from "@nestjs/common";
import { CommonModule } from "src/common/common.module";
import { TagController } from "./tag.controller";
import { TagService } from "./tag.service";

@Module({
  imports: [
    forwardRef(() => CommonModule),
  ],
  controllers: [
    TagController,
  ],
  providers: [
    TagService,
  ],
  exports: [
    TagService,
  ]
})
export class TagModule { }