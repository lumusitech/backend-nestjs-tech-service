import { parseBoolean } from './boolean-filter.util';

describe('parseBoolean', () => {
  it('should parse "true" string to true', () => {
    expect(parseBoolean('true')).toBe(true);
  });

  it('should parse "false" string to false', () => {
    expect(parseBoolean('false')).toBe(false);
  });

  it('should parse boolean true to true', () => {
    expect(parseBoolean(true)).toBe(true);
  });

  it('should parse boolean false to false', () => {
    expect(parseBoolean(false)).toBe(false);
  });

  it('should return undefined for invalid values', () => {
    expect(parseBoolean('yes')).toBeUndefined();
    expect(parseBoolean('')).toBeUndefined();
    expect(parseBoolean(undefined)).toBeUndefined();
    expect(parseBoolean(null)).toBeUndefined();
    expect(parseBoolean(123)).toBeUndefined();
  });

  it('should be case sensitive for true/false', () => {
    expect(parseBoolean('True')).toBeUndefined();
    expect(parseBoolean('FALSE')).toBeUndefined();
  });
});
