import { CachingService, ErdnestConfigService, ERDNEST_CONFIG_SERVICE, JwtAuthenticateGuard, NativeAuthGuard } from '@elrondnetwork/erdnest';
import { Injectable, CanActivate, ExecutionContext, Inject } from '@nestjs/common';

@Injectable()
export class JwtOrNativeAuthGuard implements CanActivate {
  constructor(
    @Inject(ERDNEST_CONFIG_SERVICE)
    private readonly erdnestConfigService: ErdnestConfigService,
    private readonly cachingService: CachingService
  ) { }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const jwtGuard = new JwtAuthenticateGuard(this.erdnestConfigService);
    const nativeAuthGuard = new NativeAuthGuard(this.cachingService);

    try {
      const result = await jwtGuard.canActivate(context);
      if (result) {
        return true;
      }
    } catch (error) {
      // do nothing
    }

    try {
      return await nativeAuthGuard.canActivate(context);
    } catch (error) {
      return false;
    }
  }
}
