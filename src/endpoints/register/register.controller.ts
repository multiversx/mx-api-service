import {
    Controller,
    Post,
    Body,
    Logger,
    BadRequestException,
} from '@nestjs/common';
import { UserDbService } from 'src/common/persistence/userdb/user.db.service';
import { AuthService } from 'src/common/auth/auth.service';
import { TransactionDbService } from 'src/common/persistence/transactiondb/transactiondb.service';
import { ApiResponse, ApiTags } from "@nestjs/swagger";

interface UserRegistration {
    access_token: string;
    transaction_address: string; // Address of transaction proving payment
}

@Controller('register')
@ApiTags('register')
export class RegisterController {
    private logger: Logger = new Logger(RegisterController.name);
    constructor(
        private authService: AuthService,
        private userDbService: UserDbService,
        private transactionDbService: TransactionDbService,
    ) { }

    /**
     * Registration endpoint
     * Allows a user to send an access token and a transaction
     * in order to be part of the system and receive an availability
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
        this.logger.log('Starting user registration');

        try {
            const access_token = body?.access_token;
            const transaction_address = body?.transaction_address;

            if (!access_token || !transaction_address) {
                throw new BadRequestException('Missing access token or transaction address');
            }

            // returns user_address, availability date and extra time to
            // add to use in case of being already registered
            const [user_address, availability, extra_availability] =
                await this.authService.validateUser(
                    body.access_token,
                    body.transaction_address,
                );

            await this.transactionDbService.createTransaction({
                tx_hash: transaction_address,
            });

            const user = await this.userDbService.findUser(user_address);

            if (user) {
                await this.userDbService.updateUserAvailability(
                    user_address,
                    user.availability + extra_availability,
                );
            } else {
                await this.userDbService.createUser({
                    address: user_address,
                    availability: availability,
                });
            }
        } catch (error) {
            // TODO: rollback user and transaction if added
            this.logger.error(error);
            throw new BadRequestException(error);
        }
    }
}

