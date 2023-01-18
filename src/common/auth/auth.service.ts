import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { TransactionDbService } from '../persistence/transactiondb/transactiondb.service';
import { ApiService, OriginLogger } from '@elrondnetwork/erdnest';
import { ApiConfigService } from '../api-config/api.config.service';
import { NativeAuthService } from '../nativeauth/nativeauth.service';

const EGLD_PER_TIME_UNIT = process.env.EGLD_PER_TIME_UNIT
  ? parseInt(process.env.EGLD_PER_TIME_UNIT, 10)
  : Math.floor(1000000000000000000 / 730); // 1 EGLD / 730 hours per month

@Injectable()
export class AuthService {
  private readonly logger = new OriginLogger(AuthService.name);
  constructor(
    private readonly apiService: ApiService,
    private readonly transactionDbService: TransactionDbService,
    private readonly apiConfigService: ApiConfigService,
    private readonly nativeAuthService: NativeAuthService,
  ) { }

  /**
   *
   * @param access_token
   * @param transaction_address
   * @returns
   */
  async validateUser(
    access_token: string,
    transaction_address: string,
  ): Promise<any> {
    // Validate the access token
    const token_data = await this.nativeAuthService.validateAndReturnAccessToken(
      access_token,
    );

    // Verify that transaction is not already processed
    const transaction = await this.transactionDbService.findTransaction(
      transaction_address,
    );
    console.log(transaction);
    if (transaction) {
      throw new HttpException(
        `Transaction ${transaction_address} already processed.`,
        HttpStatus.BAD_REQUEST,
      );
    }
    console.log(`${this.apiConfigService.getApiUrls()[0]}/transaction/${transaction_address}`);
    // Get transaction details
    const tx_data = (
      await this.apiService
        .get(`${this.apiConfigService.getApiUrls()[0]}/transaction/${transaction_address}`, {
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
    console.warn(tx_data);
    // Verify transaction was successful
    if (tx_data.status != 'success') {
      throw new HttpException(
        `Transaction ${transaction_address} not successful.`,
        HttpStatus.BAD_REQUEST,
      );
    }

    // Verify that wallet key  from token coincides with transaction address sender
    if (token_data.address !== tx_data.sender) {
      throw new HttpException(
        'Wallet address from token does not match transaction sender address',
        HttpStatus.BAD_REQUEST,
      );
    }

    // Validate receiver address is one of the config addresses
    if (
      !this.apiConfigService.getLiveWebsocketEventsAllowedReceivers()
        .includes(tx_data.receiver)
    ) {
      throw new HttpException(
        'Receiver address is not correct. Please check your transaction.',
        HttpStatus.BAD_REQUEST,
      );
    }

    // Compute number of seconds hours per EGLD
    const time_units_per_transaction = Math.floor(
      parseInt(tx_data.value, 10) / EGLD_PER_TIME_UNIT,
    );

    // Transform hours period into milliseconds
    const extra_availability = time_units_per_transaction * 60 * 60 * 1000;

    // Compute availability period at HOUR granularity
    const availability =
      (Math.floor(Date.now() / 1000 / 60 / 60) + time_units_per_transaction) *
      60 *
      60 *
      1000;

    return [token_data.address, availability, extra_availability];
  }
}
