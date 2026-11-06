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

  it.each([
    '/docs/package.json/',
    '/DOCS/package.json',
    '/Docs/package.json',
    '/docs//package.json',
    '/docs/./package.json',
    '/docs/x/../package.json',
    '/docs/%70ackage.json',
  ])('should throw NotFoundException for the restricted route variant %s', (path) => {
    apiConfigService.getRestrictedRoutes.mockReturnValue(['/docs/package.json']);

    const req = { path } as Request;
    const res = {} as Response;
    const next = jest.fn();

    expect(() => middleware.use(req, res, next)).toThrow(NotFoundException);
    expect(next).not.toHaveBeenCalled();
  });

  it('should normalize the configured restricted routes', () => {
    apiConfigService.getRestrictedRoutes.mockReturnValue(['/Docs/Package.json/']);

    const req = { path: '/docs/package.json' } as Request;
    const res = {} as Response;
    const next = jest.fn();

    expect(() => middleware.use(req, res, next)).toThrow(NotFoundException);
  });

  it('should call next for malformed encoded paths that are not restricted', () => {
    apiConfigService.getRestrictedRoutes.mockReturnValue(['/blocked']);

    const req = { path: '/allowed%E0%A4%A' } as Request;
    const res = {} as Response;
    const next = jest.fn();

    middleware.use(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
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
