import {
  Injectable,
  CanActivate,
  ExecutionContext,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { OriginLogger } from '@multiversx/sdk-nestjs';
import { AuthService } from './auth.service';

@Injectable()
export class AuthGuardWs implements CanActivate {
  private readonly logger = new OriginLogger(AuthGuardWs.name);

  constructor(private readonly authService: AuthService) { }

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const socket = context.switchToWs().getClient();
    this.logger.log(`Verifying socket ${socket.id}`);
    return this.authService.validateRequest(socket, null);
  }
}
