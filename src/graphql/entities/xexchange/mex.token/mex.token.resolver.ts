import { Resolver } from "@nestjs/graphql";
import { MexToken } from "src/endpoints/mex/entities/mex.token";
import { MexTokenService } from "src/endpoints/mex/mex.token.service";
import { MexTokensQuery } from "./mex.token.query";

@Resolver(() => MexToken)
export class MexTokensResolver extends MexTokensQuery {
  constructor(mexTokenService: MexTokenService) {
    super(mexTokenService);
  }
}
