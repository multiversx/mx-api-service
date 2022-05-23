import { NativeAuthServer } from '@elrondnetwork/native-auth';
import { Injectable, CanActivate, ExecutionContext, Logger, UnauthorizedException } from '@nestjs/common';
import { CachingService } from 'src/common/caching/caching.service';

@Injectable()
export class NativeAuthGuard implements CanActivate {
  private readonly logger: Logger;
  private readonly authServer: NativeAuthServer;

  constructor(cachingService: CachingService) {
    this.logger = new Logger(NativeAuthGuard.name);
    this.authServer = new NativeAuthServer({
      cache: {
        getValue: async function <T>(key: string): Promise<T | undefined> {
          if (key === 'block:timestamp:latest') {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            return new Date().getTime() / 1000;
          }

          return await cachingService.getCache<T>(key);
        },
        setValue: async function <T>(key: string, value: T, ttl: number): Promise<void> {
          await cachingService.setCache(key, value, ttl);
        },
      },
    });
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    const host = new URL(request.headers['origin']).hostname;

    const authorization: string = request.headers['authorization'];
    if (!authorization) {
      return false;
    }
    const jwt = authorization.replace('Bearer ', '');

    try {
      const userInfo = await this.authServer.validate(jwt);
      if (userInfo.host !== host) {
        this.logger.error(`Invalid host '${userInfo.host}'. should be '${host}'`);
        return false;
      }

      request.res.set('X-Native-Auth-Issued', userInfo.issued);
      request.res.set('X-Native-Auth-Expires', userInfo.expires);
      request.res.set('X-Native-Auth-Address', userInfo.address);
      request.res.set('X-Native-Auth-Timestamp', Math.round(new Date().getTime() / 1000));

      request.nativeAuth = userInfo;
      return true;
    } catch (error) {
      this.logger.error(error);
      throw new UnauthorizedException();
    }
  }
}
