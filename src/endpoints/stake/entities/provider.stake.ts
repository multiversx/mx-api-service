import { SwaggerUtils } from "@elrondnetwork/nestjs-microservice-template";
import { ApiProperty } from "@nestjs/swagger";
import { ProviderUnstakedTokens } from "./provider.unstaked.tokens";

export class ProviderStake {
    @ApiProperty(SwaggerUtils.amountPropertyOptions())
    totalStaked: string = '';

    @ApiProperty({ type: ProviderUnstakedTokens, isArray: true, nullable: true })
    unstakedTokens: ProviderUnstakedTokens[] | undefined = undefined;
}
