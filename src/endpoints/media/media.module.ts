import { Module } from "@nestjs/common";
import { MediaService } from "./media.service";

@Module({
  imports: [],
  providers: [
    MediaService,
  ],
  exports: [
    MediaService,
  ],
})
export class MediaModule { }
