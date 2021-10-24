import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { ApiConfigService } from 'src/common/api-config/api.config.service';

@Injectable()
export class JwtAdminGuard implements CanActivate {
  constructor(
    private readonly apiConfigService: ApiConfigService
  ) {}

  async canActivate(
    context: ExecutionContext,
  ): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    let jwt = request.jwt;

    let admins = this.apiConfigService.getSecurityAdmins();
    if (!admins) {
      return false;
    }

    return admins.includes(jwt.address);
  }
}