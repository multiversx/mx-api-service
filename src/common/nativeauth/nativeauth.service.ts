import { OriginLogger } from "@multiversx/sdk-nestjs";
import { NativeAuthServer } from "@elrondnetwork/native-auth";
import { Injectable } from "@nestjs/common";
import configuration from "config/configuration";

@Injectable()
export class NativeAuthService {
    private readonly logger = new OriginLogger(NativeAuthServer.name);
    private server = new NativeAuthServer({ apiUrl: configuration()?.urls?.api?.[0] });
    constructor() {
    }

    /**
     * Validate an access token and return information contained into it
     * Exceptions should be handled one layer above
     * @param accessToken 
     * @returns 
     */
    async validateAccessTokenAndReturnData(accessToken: string) {
        this.logger.log(`Validating token ${accessToken}`);
        // Validate token
        await this.server.validate(accessToken);

        // Get details from access token
        const details = this.server.decode(accessToken);
        return details;
    }
}
