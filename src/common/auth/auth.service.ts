import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { TransactionDbService } from '../persistence/transactiondb/transactiondb.service';
import { ApiService, OriginLogger } from '@elrondnetwork/erdnest';
import { ApiConfigService } from '../api-config/api.config.service';
import { NativeAuthService } from '../nativeauth/nativeauth.service';

@Injectable()
export class AuthService {
  private readonly logger = new OriginLogger(AuthService.name);
  constructor(
    private readonly apiService: ApiService,
    private readonly transactionDbService: TransactionDbService,
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
}
