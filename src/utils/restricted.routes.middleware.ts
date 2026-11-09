import { Injectable, NestMiddleware, NotFoundException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { posix } from 'path';
import { ApiConfigService } from 'src/common/api-config/api.config.service';

@Injectable()
export class RestrictedRoutesMiddleware implements NestMiddleware {
  constructor(
    private readonly apiConfigService: ApiConfigService,
  ) { }

  use(req: Request, _res: Response, next: NextFunction) {
    const restrictedRoutes = this.apiConfigService.getRestrictedRoutes().map(route => this.normalizePath(route));
    if (restrictedRoutes.includes(this.normalizePath(req.path))) {
      throw new NotFoundException(`Cannot GET ${req.path}`);
    }

    next();
  }

  private normalizePath(path: string): string {
    return posix.normalize(this.decodePath(path)).toLowerCase().replace(/\/+$/, '') || '/';
  }

  private decodePath(path: string): string {
    try {
      return decodeURIComponent(path);
    } catch {
      return path;
    }
  }
}
