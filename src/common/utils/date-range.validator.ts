import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ name: 'isDateRangeValid', async: false })
class DateRangeConstraint implements ValidatorConstraintInterface {
  validate(_value: unknown, args: ValidationArguments): boolean {
    const object = args.object as Record<string, unknown>;
    const dateFrom = object.dateFrom;
    const dateTo = object.dateTo;

    if (
      typeof dateFrom !== 'string' ||
      typeof dateTo !== 'string' ||
      !dateFrom ||
      !dateTo
    ) {
      return true;
    }

    return dateFrom <= dateTo;
  }

  defaultMessage(args: ValidationArguments): string {
    const object = args.object as Record<string, unknown>;
    return `dateFrom (${String(object.dateFrom)}) must not be greater than dateTo (${String(object.dateTo)})`;
  }
}

export function IsDateRangeValid(
  validationOptions?: ValidationOptions,
): PropertyDecorator {
  return (object: object, propertyName: string | symbol) => {
    registerDecorator({
      name: 'isDateRangeValid',
      target: object.constructor,
      propertyName: propertyName as string,
      options: validationOptions,
      validator: DateRangeConstraint,
    });
  };
}
