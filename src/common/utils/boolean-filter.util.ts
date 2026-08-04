import { Transform, TransformFnParams } from 'class-transformer';

export function parseBoolean(value: unknown): boolean | undefined {
  if (value === 'true' || value === true) return true;
  if (value === 'false' || value === false) return false;
  return undefined;
}

export function ToBoolean(): PropertyDecorator {
  return Transform(({ value }: TransformFnParams) => parseBoolean(value));
}
