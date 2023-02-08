import {
  Injectable,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { UserDbService } from 'src/common/persistence/services/user.db.service';
import { AuthService } from 'src/common/auth/auth.service';
import { TransactionDbService } from 'src/common/persistence/services/transaction.db.service';

Injectable();
export class RegisterService {

  constructor(
    @Inject(forwardRef(() => AuthService))
    private readonly authService: AuthService,
    @Inject(forwardRef(() => UserDbService))
    private readonly userDbService: UserDbService,
    @Inject(forwardRef(() => TransactionDbService))
    private readonly transactionDbService: TransactionDbService,
  ) { }

  /**
   * Returns user_address, expiryDate date and extra time to 
   * add to use in case of being already registered
   * 
   * @param accessToken 
   * @param transactionAddress 
   */
  async registerUser(accessToken: string, transactionAddress: string) {
    const { address, expiryDate, extraTime } =
      await this.authService.validateUser(
        accessToken,
        transactionAddress,
      );

    await this.transactionDbService.createTransaction({
      txHash: transactionAddress,
    });

    const user = await this.userDbService.findUser(address);

    if (user) {
      await this.userDbService.updateUserExpiryDate(
        address,
        user.expiryDate + extraTime,
      );
    } else {
      await this.userDbService.createUser({
        address,
        expiryDate: expiryDate,
      });
    }
  }
}
