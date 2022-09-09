import { Module } from "@nestjs/common";
import { AssetsModule } from "src/common/assets/assets.module";
import { LogoService } from "./logo.service";

@Module({
  imports: [AssetsModule],
  providers: [LogoService],
  exports: [LogoService],
})
export class LogoModule { }
