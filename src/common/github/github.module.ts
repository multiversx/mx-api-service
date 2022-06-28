import { ApiModule } from "@elrondnetwork/nestjs-microservice-common";
import { Module } from "@nestjs/common";
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
