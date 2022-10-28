import { forwardRef, Inject } from "@nestjs/common";
import { PersistenceService } from "src/common/persistence/persistence.service";

export function ReadKeyFromDbIfExists(key: string) {
  const persistenceService = Inject(forwardRef(() => PersistenceService));

  return (target: Object,
    _propertyKey: string,
    descriptor: PropertyDescriptor
  ) => {
    const originalMethod = descriptor.value;
    persistenceService(target, 'persistenceService');

    descriptor.value = async function (...args: any[]) {
      //@ts-ignore
      const persistenceService: PersistenceService = this.persistenceService;

      const keyValue = await persistenceService.getSettingValue(key);
      if (keyValue) return keyValue;

      return originalMethod.apply(this, args);
    };

    return descriptor;
  };
}

