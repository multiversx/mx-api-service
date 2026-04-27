import { NestMiddleware, NotFoundException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { ApiConfigService } from 'src/common/api-config/api.config.service';

export class RestrictedRoutesMiddleware implements NestMiddleware {
  constructor(
    private readonly apiConfigService: ApiConfigService,
  ) { }
  use(req: Request, _res: Response, next: NextFunction) {
    const restrictedRoutes = this.apiConfigService.getRestrictedRoutes();
    if (restrictedRoutes.includes(req.path)) {
      throw new NotFoundException(`Cannot GET ${req.path}`);
    }

    next();
  }
}