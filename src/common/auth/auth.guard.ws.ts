import {
  Injectable,
  CanActivate,
  ExecutionContext,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { OriginLogger } from '@multiversx/sdk-nestjs';
import { AuthService } from './auth.service';
import { Socket } from 'socket.io';

@Injectable()
export class AuthGuardWs implements CanActivate {
  private readonly logger = new OriginLogger(AuthGuardWs.name);

  constructor(private readonly authService: AuthService) { }

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const socket: Socket = context.switchToWs().getClient();
    this.logger.log(`Verifying socket ${socket.id}`);

    return this.authService.validateRequest(socket.handshake.auth?.token).then((user) => { return !!user; });
  }
}
