import { Module, forwardRef } from "@nestjs/common";
import { TokenRolesService } from "./token.roles.service";
import { IndexerModule } from "src/common/indexer/indexer.module";
import { CollectionModule } from "src/endpoints/collections/collection.module";

@Module({
  imports: [
    forwardRef(() => IndexerModule),
    forwardRef(() => CollectionModule),
  ],
  providers: [
    TokenRolesService,
  ],
  exports: [
    TokenRolesService,
  ],
})
export class TokenRolesModule { }
