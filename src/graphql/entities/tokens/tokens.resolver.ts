import { Resolver } from "@nestjs/graphql";
import { TokenDetailed } from "src/endpoints/tokens/entities/token.detailed";
import { TokenService } from "src/endpoints/tokens/token.service";
import { TokenQuery } from "./tokens.query";

@Resolver(() => TokenDetailed)
export class TokenResolver extends TokenQuery {
  constructor(tokenService: TokenService) {
    super(tokenService);
  }
}
