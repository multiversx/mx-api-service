import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';

@ValidatorConstraint({ async: false })
export class NoEmptyPayloadConstraint implements ValidatorConstraintInterface {
  validate(_value: any, args: ValidationArguments) {
    const object = args.object as any;

    if (!object) {
      return false;
    }

    return Object.keys(object).some((key) => {
      const propertyValue = object[key];
      return propertyValue !== undefined && propertyValue !== null;
    });
  }

  defaultMessage(_args: ValidationArguments) {
    return 'Payload cannot be empty. At least one property must be provided.';
  }
}

export function NoEmptyPayload(validationOptions?: ValidationOptions) {
  return function (target: Function) {
    registerDecorator({
      target: target,
      propertyName: '',
      options: validationOptions,
      constraints: [],
      validator: NoEmptyPayloadConstraint,
    });
  };
}
