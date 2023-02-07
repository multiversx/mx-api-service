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
     * @param access_token 
     * @returns 
     */
    async validateAndReturnAccessToken(access_token: string) {
        this.logger.log(`Validating token ${access_token}`);
        // Validate token
        await this.server.validate(access_token);

        // Get details from access token
        const details = this.server.decode(access_token);
        return details;
    }
}
