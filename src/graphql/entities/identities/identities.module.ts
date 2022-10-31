import { Module } from "@nestjs/common";
import { IdentityResolver } from "./identitites.resolver";
import { IdentitiesModule as InternalIdentitiesModule } from "src/endpoints/identities/identities.module";

@Module({
  imports: [InternalIdentitiesModule],
  providers: [IdentityResolver],
})
export class IdentitiesModule { }
