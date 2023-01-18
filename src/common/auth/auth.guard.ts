import {
  Injectable,
  CanActivate,
  ExecutionContext,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { UserDbService as UserService } from '../persistence/userdb/user.db.service';
import { UserDb as User } from '../persistence/userdb/entities/user.db';
import { Socket } from 'socket.io';
import { OriginLogger } from '@elrondnetwork/erdnest';
import { NativeAuthService } from '../nativeauth/nativeauth.service';

@Injectable()
export class AuthGuardWs implements CanActivate {
  private readonly logger = new OriginLogger(AuthGuardWs.name);

  constructor(private userService: UserService, private readonly nativeAuthService: NativeAuthService) { }

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const socket = context.switchToWs().getClient();
    return this.validateRequest(socket, null);
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
    user_details: User | null,
  ): Promise<boolean> {
    const access_token = socket.handshake.auth.token;

    // If no authentication token was provided, deny request
    if (!access_token) {
      return false;
    }

    try {
      // Validate access token
      const details = await this.nativeAuthService.validateAndReturnAccessToken(
        access_token,
      );

      // Validate that the user address from token is registered
      const user = await this.userService.findUser(details.address);
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

      if (user_details) {
        user_details.address = user.address;
        user_details.availability = user.availability;
      }

      return true;
    } catch (error) {
      this.logger.error(error);
      return false;
    }
  }
}
