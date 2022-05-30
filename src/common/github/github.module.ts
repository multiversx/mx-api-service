import { Module } from "@nestjs/common";
import { ApiModule } from "../network/api.module";
import { GithubService } from "./github.service";

@Module({
  imports: [
    ApiModule,
  ],
  providers: [
    GithubService,
  ],
  exports: [
    GithubService,
  ],
})
export class GithubModule { }
