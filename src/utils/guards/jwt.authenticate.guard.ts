import { Injectable, CanActivate, ExecutionContext, Logger } from '@nestjs/common';
import { verify } from 'jsonwebtoken';
import { ApiConfigService } from 'src/common/api-config/api.config.service';

@Injectable()
export class JwtAuthenticateGuard implements CanActivate {
  private readonly logger: Logger

  constructor(
    private readonly apiConfigService: ApiConfigService
  ) {
    this.logger = new Logger(JwtAuthenticateGuard.name);
  }

  async canActivate(
    context: ExecutionContext,
  ): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    let authorization: string = request.headers['authorization'];
    if (!authorization) {
      return false;
    }

    let jwt = authorization.replace('Bearer ', '');

    try {
      let jwtSecret = this.apiConfigService.getJwtSecret();

      request.jwt = await new Promise((resolve, reject) => {
        verify(jwt, jwtSecret, (err: any, decoded: any) => {
          if (err) {
            reject(err);
          }
        
          // @ts-ignore
          resolve(decoded.user);
        });
      });

    } catch (error) {
      this.logger.error(error);
      return false;
    }

    return true;
  }
}