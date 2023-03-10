import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { TransactionDbService } from '../persistence/services/transaction.db.service';
import { ApiService, OriginLogger } from '@multiversx/sdk-nestjs';
import { ApiConfigService } from '../api-config/api.config.service';
import { NativeAuthService } from '../nativeauth/nativeauth.service';
import { UserDbService } from '../persistence/services/user.db.service';
import { UserDb } from '../persistence/entities/user.db';

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

  computeUserExpiryDate(egldValue: number): { expiryDate: number; extraTime: number } {
    // Compute number of seconds hours per EGLD
    const timeUnits = Math.floor(
      egldValue / this.apiConfigService.getLiveWebsocketEventsEgldPerTimeUnit(),
    );

    // Transform hours period into milliseconds
    const extraTime = timeUnits * 60 * 60 * 1000;

    // Compute expiryDate period at HOUR granularity
    const expiryDate =
      (Math.floor(Date.now() / 1000 / 60 / 60) + timeUnits) *
      60 *
      60 *
      1000;

    return { expiryDate, extraTime };
  }

  /**
   *
   * @param accessToken
   * @param txHash
   * @returns
   */
  async validateUser(
    address: string,
    txHash: string,
  ): Promise<{ expiryDate: number, extraTime: number }> {
    // Verify that transaction is not already processed
    const transaction = await this.transactionDbService.findTransaction(
      txHash,
    );

    if (transaction) {
      throw new HttpException(
        `Transaction ${txHash} already processed.`,
        HttpStatus.BAD_REQUEST,
      );
    }

    // Get transaction details
    const txData = (
      await this.apiService
        .get(`${this.apiConfigService.getApiUrls()[0]}/transaction/${txHash}`, {
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
        `Transaction ${txHash} not successful.`,
        HttpStatus.BAD_REQUEST,
      );
    }

    // Verify that wallet key  from token coincides with transaction address sender
    if (address !== txData.sender) {
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

    return { ...this.computeUserExpiryDate(parseInt(txData.value, 10)) };
  }

  /**
   * Validate request
   *  - Auth Token has to be valid
   *  - User has to exist
   *  - User expiryDate must not be expired
   *
   * @param socket
   * @returns
   */
  async validateRequest(
    accessToken: string | undefined,
  ): Promise<UserDb | undefined> {
    // If no authentication token was provided, deny request
    if (!accessToken) {
      return undefined;
    }

    try {
      // Validate access token
      const details = await this.nativeAuthService.validateAccessTokenAndReturnData(
        accessToken,
      );

      // Validate that the user address from token is registered
      const user = await this.userDbService.findUser(details.address);
      if (!user) {
        this.logger.error(`User with address ${details.address} not found`);
        return undefined;
      }

      const date = new Date(user.expiryDate);
      // Check if date is expired
      if (date.getTime() < Date.now()) {
        this.logger.error(
          `User with address ${details.address} access expired on ${date}`,
        );
        return undefined;
      }

      return user;
    } catch (error) {
      this.logger.error(error);
      return undefined;
    }
  }
}
