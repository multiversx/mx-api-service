import { CanActivate, ExecutionContext, Injectable, Logger } from "@nestjs/common";
import { TokenExpiredError, verify } from 'jsonwebtoken';
import { ApiConfigService } from "src/common/api-config/api.config.service";
import { NoAuthOptions } from "src/decorators/no.auth";
import { DecoratorUtils } from "../decorator.utils";

@Injectable()
export class JwtAuthenticateGlobalGuard implements CanActivate {
  private readonly logger: Logger;

  constructor(
    private readonly apiConfigService: ApiConfigService
  ) {
    this.logger = new Logger(JwtAuthenticateGlobalGuard.name);
  }

  async canActivate(
    context: ExecutionContext,
  ): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    const noAuthMethodMetadata = DecoratorUtils.getMethodDecorator(NoAuthOptions, context.getHandler());
    if (noAuthMethodMetadata) {
      return true;
    }

    const authorization: string = request.headers['authorization'];
    if (!authorization) {
      return false;
    }

    const jwt = authorization.replace('Bearer ', '');

    try {
      const jwtSecret = this.apiConfigService.getJwtSecret();

      const accessAddress = await new Promise((resolve, reject) => {
        verify(jwt, jwtSecret, (err, decoded) => {
          if (err) {
            reject(err);
          }

          // @ts-ignore
          resolve(decoded.accessAddress);
        });
      });

      if (accessAddress !== this.apiConfigService.getAccessAddress()) {
        return false;
      }
    } catch (error) {
      if (error instanceof TokenExpiredError) {
        return false;
      }

      this.logger.error(error);
      return false;
    }

    return true;
  }
}
