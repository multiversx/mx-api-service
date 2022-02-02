import { Type } from "@nestjs/common";

export class DecoratorUtils {
  static registerMethodDecorator<T>(type: Type<T>): (options?: T) => MethodDecorator {
    return (options?: T): MethodDecorator => (_, __, descriptor: any) => {
      Reflect.defineMetadata(type.name, Object.assign(new type(), options), descriptor.value);
      return descriptor;
    };
  }

  static registerClassDecorator<T>(type: Type<T>): (options?: T) => MethodDecorator {
    return (options?: T): MethodDecorator => (_, __, descriptor: any) => {
      Reflect.defineMetadata(type.name, Object.assign(new type(), options), descriptor.value);
      return descriptor;
    };
  }

  static getMethodDecorator<T>(type: Type<T>, target: Function): T | undefined {
    return this.getDecoratorOptions(type, target);
  }

  static getClassDecorator<TClass, TResult>(type: Type<TResult>, target: Type<TClass>): TResult | undefined {
    return this.getDecoratorOptions(type, target);
  }

  private static getDecoratorOptions<T>(type: Type<T>, target: Object): T | undefined {
    const metadata = Reflect.getOwnMetadata(type.name, target);
    if (!metadata) {
      return undefined;
    }

    if (!(metadata instanceof type)) {
      return undefined;
    }

    return metadata;
  }
}
