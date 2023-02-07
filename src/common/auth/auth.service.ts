import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { TransactionDbService } from '../persistence/transactiondb/transactiondb.service';
import { ApiService, OriginLogger } from '@multiversx/sdk-nestjs';
import { ApiConfigService } from '../api-config/api.config.service';
import { NativeAuthService } from '../nativeauth/nativeauth.service';
import { UserDbService } from '../persistence/userdb/user.db.service';
import { Socket } from 'socket.io';
import { UserDb } from '../persistence/userdb/entities/user.db';

@Injectable()
export class AuthService {
  private readonly logger = new OriginLogger(AuthService.name);
  constructor(
    private readonly apiService: ApiService,
    private readonly transactionDbService: TransactionDbService,
    private readonly userDbService: UserDbService,
    private readonly apiConfigService: ApiConfigService,
    private readonly nativeAuthService: NativeAuthService,
  ) { }

  computeUserAvailability(egldValue: number) {
    // Compute number of seconds hours per EGLD
    const timeUnits = Math.floor(
      egldValue / this.apiConfigService.getLiveWebsocketEventsEgldPerTimeUnit(),
    );

    // Transform hours period into milliseconds
    const extraAvailability = timeUnits * 60 * 60 * 1000;

    // Compute availability period at HOUR granularity
    const availability =
      (Math.floor(Date.now() / 1000 / 60 / 60) + timeUnits) *
      60 *
      60 *
      1000;

    return [availability, extraAvailability];
  }

  /**
   *
   * @param accessToken
   * @param transactionAddress
   * @returns
   */
  async validateUser(
    accessToken: string,
    transactionAddress: string,
  ): Promise<any> {
    // Validate the access token
    const tokenData = await this.nativeAuthService.validateAndReturnAccessToken(
      accessToken,
    );

    // Verify that transaction is not already processed
    const transaction = await this.transactionDbService.findTransaction(
      transactionAddress,
    );

    if (transaction) {
      throw new HttpException(
        `Transaction ${transactionAddress} already processed.`,
        HttpStatus.BAD_REQUEST,
      );
    }

    // Get transaction details
    const txData = (
      await this.apiService
        .get(`${this.apiConfigService.getApiUrls()[0]}/transaction/${transactionAddress}`, {
          headers: {
            Accept: 'application/json',
          },
        })
        .catch((error) => {
          this.logger.error(error.message);
          throw new HttpException(
            'Error getting transaction data',
            HttpStatus.BAD_REQUEST,
          );
        })
    ).data.data.transaction;

    // Verify transaction was successful
    if (txData.status != 'success') {
      throw new HttpException(
        `Transaction ${transactionAddress} not successful.`,
        HttpStatus.BAD_REQUEST,
      );
    }

    // Verify that wallet key  from token coincides with transaction address sender
    if (tokenData.address !== txData.sender) {
      throw new HttpException(
        'Wallet address from token does not match transaction sender address',
        HttpStatus.BAD_REQUEST,
      );
    }

    // Validate receiver address is one of the config addresses
    if (
      !this.apiConfigService.getLiveWebsocketEventsAllowedReceivers()
        .includes(txData.receiver)
    ) {
      throw new HttpException(
        'Receiver address is not correct. Please check your transaction.',
        HttpStatus.BAD_REQUEST,
      );
    }

    return [tokenData.address, ...this.computeUserAvailability(parseInt(txData.value, 10))];
  }

  /**
   * Validate request
   *  - Auth Token has to be valid
   *  - User has to exist
   *  - User availability must not be expired
   *
   * @param socket
   * @returns
   */
  async validateRequest(
    socket: Socket,
    userDetails: UserDb | null,
  ): Promise<boolean> {
    const accessToken = socket.handshake.auth.token;

    // If no authentication token was provided, deny request
    if (!accessToken) {
      return false;
    }

    try {
      // Validate access token
      const details = await this.nativeAuthService.validateAndReturnAccessToken(
        accessToken,
      );

      // Validate that the user address from token is registered
      const user = await this.userDbService.findUser(details.address);
      if (!user) {
        this.logger.error(`User with address ${details.address} not found`);
        return false;
      }

      const date = new Date(user.availability);
      // Check if date is expired
      if (date.getTime() < Date.now()) {
        this.logger.error(
          `User with address ${details.address} access expired on ${date}`,
        );
        return false;
      }

      if (userDetails) {
        userDetails.address = user.address;
        userDetails.availability = user.availability;
      }

      return true;
    } catch (error) {
      this.logger.error(error);
      return false;
    }
  }
}
