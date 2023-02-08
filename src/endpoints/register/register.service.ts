import {
  Injectable,
} from '@nestjs/common';
import { UserDbService } from 'src/common/persistence/services/user.db.service';
import { AuthService } from 'src/common/auth/auth.service';
import { TransactionDbService } from 'src/common/persistence/services/transactiondb.service';

Injectable();
export class RegisterService {

  constructor(
    private authService: AuthService,
    private userDbService: UserDbService,
    private transactionDbService: TransactionDbService,
  ) { }

  async registerUser(accessToken: string, transactionAddress: string) {
    // returns user_address, expiryDate date and extra time to
    // add to use in case of being already registered
    const { address, expiryDate, extraexpiryDate } =
      await this.authService.validateUser(
        accessToken,
        transactionAddress,
      );

    await this.transactionDbService.createTransaction({
      txHash: transactionAddress,
    });

    const user = await this.userDbService.findUser(address);

    if (user) {
      await this.userDbService.updateUserexpiryDate(
        address,
        user.expiryDate + extraexpiryDate,
      );
    } else {
      await this.userDbService.createUser({
        address,
        expiryDate: expiryDate,
      });
    }
  }
}
