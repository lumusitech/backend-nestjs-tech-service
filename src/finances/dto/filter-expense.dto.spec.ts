import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { FilterExpenseDto } from './filter-expense.dto';

async function transformAndValidate(
  params: Record<string, unknown>,
): Promise<FilterExpenseDto> {
  const dto = plainToInstance(FilterExpenseDto, params);
  await validate(dto);
  return dto;
}

describe('FilterExpenseDto', () => {
  describe('isRecurring boolean transform', () => {
    it('should parse "true" string to boolean true', async () => {
      const dto = await transformAndValidate({ isRecurring: 'true' });
      expect(dto.isRecurring).toBe(true);
    });

    it('should parse "false" string to boolean false', async () => {
      const dto = await transformAndValidate({ isRecurring: 'false' });
      expect(dto.isRecurring).toBe(false);
    });

    it('should keep boolean false as false', async () => {
      const dto = await transformAndValidate({ isRecurring: false });
      expect(dto.isRecurring).toBe(false);
    });

    it('should leave isRecurring undefined when not provided', async () => {
      const dto = await transformAndValidate({});
      expect(dto.isRecurring).toBeUndefined();
    });
  });

  describe('date range validation', () => {
    it('should accept valid dateFrom and dateTo', async () => {
      const dto = plainToInstance(FilterExpenseDto, {
        dateFrom: '2026-01-01',
        dateTo: '2026-12-31',
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should reject dateFrom after dateTo', async () => {
      const dto = plainToInstance(FilterExpenseDto, {
        dateFrom: '2026-12-31',
        dateTo: '2026-01-01',
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
    });

    it('should reject invalid category values', async () => {
      const dto = plainToInstance(FilterExpenseDto, { category: 'INVALID' });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });
  });
});
