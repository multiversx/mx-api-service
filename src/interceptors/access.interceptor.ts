import { CanActivate, ExecutionContext, Injectable, Logger } from "@nestjs/common";
import { verify } from 'jsonwebtoken';
import { ApiConfigService } from "src/common/api-config/api.config.service";
import { HealthCheckController } from "src/endpoints/health-check/health.check.controller";

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

    if (context.getClass().name === HealthCheckController.name) {
      return true;
    }

    let authorization: string = request.headers['authorization'];
    if (!authorization) {
      return false;
    }

    let jwt = authorization.replace('Bearer ', '');

    try {
      let jwtSecret = this.apiConfigService.getJwtSecret();

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
      this.logger.error(error);
      return false;
    }

    return true;
  }
}