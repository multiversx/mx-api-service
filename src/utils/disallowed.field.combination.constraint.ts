import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
  ValidationOptions,
  registerDecorator,
} from 'class-validator';

@ValidatorConstraint({ name: 'disallowedFieldCombination', async: false })
export class DisallowedFieldCombinationConstraint
  implements ValidatorConstraintInterface {
  validate(_value: any, args: ValidationArguments) {
    // When used as a class validator, 'value' is usually the instance itself
    // However, sometimes 'value' is undefined for class validators, so we rely on args.object
    const object = args.object as any;

    if (typeof object.constructor.getFieldsSubstitutions !== 'function') {
      return true;
    }

    const substitutions = object.constructor.getFieldsSubstitutions() as Record<string, string[]>;

    for (const [mainField, conflictingFields] of Object.entries(substitutions)) {
      if (object[mainField] !== undefined && object[mainField] !== null) {
        const hasConflict = conflictingFields.some(
          (field) => object[field] !== undefined && object[field] !== null
        );

        if (hasConflict) {
          return false;
        }
      }
    }

    return true;
  }

  defaultMessage(args: ValidationArguments) {
    const object = args.object as any;
    // Safety check in case the method is missing
    if (typeof object.constructor.getFieldsSubstitutions !== 'function') {
      return 'Validation error';
    }

    const substitutions = object.constructor.getFieldsSubstitutions();
    for (const [mainField, conflictingFields] of Object.entries(substitutions)) {
      if (object[mainField]) {
        const conflicts = (conflictingFields as string[]).filter(
          (field) => object[field] !== undefined && object[field] !== null
        );

        if (conflicts.length > 0) {
          return `You cannot provide '${mainField}' simultaneously with: ${conflicts.join(', ')}.`;
        }
      }
    }

    return 'Mutual exclusivity validation failed.';
  }
}

export function DisallowedFieldCombination(validationOptions?: ValidationOptions) {
  return function (target: Function) {
    registerDecorator({
      name: 'disallowedFieldCombination',
      target: target as Function,
      propertyName: '',
      options: validationOptions,
      constraints: [],
      validator: DisallowedFieldCombinationConstraint,
    });
  };
}
