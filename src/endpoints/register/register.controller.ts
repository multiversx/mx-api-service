import { NativeAuth, NativeAuthGuard } from '@multiversx/sdk-nestjs';
import {
    Controller,
    Post,
    Body,
    Logger,
    BadRequestException,
    UseGuards,
} from '@nestjs/common';
import { ApiResponse, ApiTags } from "@nestjs/swagger";
import { RegisterService } from './register.service';

interface UserRegistration {
    txHash: string;
}

@Controller('register')
@ApiTags('register')
export class RegisterController {
    private logger: Logger = new Logger(RegisterController.name);
    constructor(
        private readonly registerService: RegisterService
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
    @UseGuards(NativeAuthGuard)
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
        @NativeAuth('address') address: string,
    ) {
        const txHash = body?.txHash;

        if (!txHash) {
            throw new BadRequestException('Missing access token or transaction address');
        }

        this.logger.log(`Registering user with address ${address} and transaction address ${txHash}`);

        try {
            // Create user, increase change expiry date or throw an exception
            await this.registerService.registerUser(address, txHash);
        } catch (error) {
            this.logger.error(error);
            throw new BadRequestException(error);
        }
    }
}

