export const NoCache = (): MethodDecorator => (_, __, descriptor: any) => {
  Reflect.defineMetadata('caching', NoCache.name, descriptor.value);
  return descriptor;
};
