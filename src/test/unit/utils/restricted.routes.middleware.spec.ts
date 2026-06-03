import { NotFoundException } from '@nestjs/common';
import { Request, Response } from 'express';
import { ApiConfigService } from 'src/common/api-config/api.config.service';
import { RestrictedRoutesMiddleware } from 'src/utils/restricted.routes.middleware';

describe('RestrictedRoutesMiddleware', () => {
  let middleware: RestrictedRoutesMiddleware;
  let apiConfigService: jest.Mocked<ApiConfigService>;

  beforeEach(() => {
    apiConfigService = {
      getRestrictedRoutes: jest.fn(),
    } as unknown as jest.Mocked<ApiConfigService>;

    middleware = new RestrictedRoutesMiddleware(apiConfigService);
  });

  it('should throw NotFoundException when route is restricted', () => {
    apiConfigService.getRestrictedRoutes.mockReturnValue(['/blocked']);

    const req = {
      path: '/blocked',
    } as Request;
    const res = {} as Response;
    const next = jest.fn();

    expect(() => middleware.use(req, res, next)).toThrow(NotFoundException);
    expect(() => middleware.use(req, res, next)).toThrow('Cannot GET /blocked');
    expect(next).not.toHaveBeenCalled();
  });

  it('should call next when route is not restricted', () => {
    apiConfigService.getRestrictedRoutes.mockReturnValue(['/blocked']);

    const req = {
      path: '/allowed',
    } as Request;
    const res = {} as Response;
    const next = jest.fn();

    middleware.use(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
  });
});
