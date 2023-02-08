import {
    Controller,
    Post,
    Body,
    Logger,
    BadRequestException,
} from '@nestjs/common';
import { ApiResponse, ApiTags } from "@nestjs/swagger";
import { RegisterService } from './register.service';

interface UserRegistration {
    accessToken: string;
    transactionAddress: string; // Address of transaction proving payment
}

@Controller('register')
@ApiTags('register')
export class RegisterController {
    private logger: Logger = new Logger(RegisterController.name);
    constructor(
        private registerService: RegisterService
    ) { }

    /**
     * Registration endpoint
     * Allows a user to send an access token and a transaction
     * in order to be part of the system and receive an expiryDate
     * period for receiving events.
     *
     * @param body UserRegistration
     * @param res Response
     * @returns HttpResponse
     */
    @Post()
    @ApiResponse({
        status: 201,
        description: 'User registered successfully!',
    })
    @ApiResponse({
        status: 400,
        description: 'Bad request. Invalid user data.',
    })
    async registerUser(
        @Body() body: UserRegistration,
    ) {
        try {
            const accessToken = body?.accessToken;
            const transactionAddress = body?.transactionAddress;

            if (!accessToken || !transactionAddress) {
                throw new BadRequestException('Missing access token or transaction address');
            }

            this.logger.log(`Registering user with access token ${accessToken} and transaction address ${transactionAddress}`);

            // Create user, increase change expiry date or throw an exception
            await this.registerService.registerUser(accessToken, transactionAddress);
        } catch (error) {
            // TODO: rollback user and transaction if added
            this.logger.error(error);
            throw new BadRequestException(error);
        }
    }
}

