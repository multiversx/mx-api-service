import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { ApiConfigService } from 'src/common/api-config/api.config.service';

@Injectable()
export class JwtAdminGuard implements CanActivate {
  constructor(
    private readonly apiConfigService: ApiConfigService
  ) { }

  // eslint-disable-next-line require-await
  async canActivate(
    context: ExecutionContext,
  ): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    const jwt = request.jwt;

    const admins = this.apiConfigService.getSecurityAdmins();
    if (!admins) {
      return false;
    }

    return admins.includes(jwt.address);
  }
}
