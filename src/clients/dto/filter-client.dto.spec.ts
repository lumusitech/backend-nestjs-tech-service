import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { FilterClientDto } from './filter-client.dto';

async function transformAndValidate(
  params: Record<string, unknown>,
): Promise<FilterClientDto> {
  const dto = plainToInstance(FilterClientDto, params);
  await validate(dto);
  return dto;
}

describe('FilterClientDto', () => {
  describe('isActive boolean transform', () => {
    it('should parse "true" string to boolean true', async () => {
      const dto = await transformAndValidate({ isActive: 'true' });
      expect(dto.isActive).toBe(true);
    });

    it('should parse "false" string to boolean false', async () => {
      const dto = await transformAndValidate({ isActive: 'false' });
      expect(dto.isActive).toBe(false);
    });

    it('should keep boolean false as false', async () => {
      const dto = await transformAndValidate({ isActive: false });
      expect(dto.isActive).toBe(false);
    });

    it('should keep boolean true as true', async () => {
      const dto = await transformAndValidate({ isActive: true });
      expect(dto.isActive).toBe(true);
    });

    it('should leave isActive undefined when not provided', async () => {
      const dto = await transformAndValidate({});
      expect(dto.isActive).toBeUndefined();
    });
  });

  describe('date range validation', () => {
    it('should accept valid dateFrom and dateTo', async () => {
      const dto = plainToInstance(FilterClientDto, {
        dateFrom: '2026-01-01',
        dateTo: '2026-12-31',
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should reject dateFrom after dateTo', async () => {
      const dto = plainToInstance(FilterClientDto, {
        dateFrom: '2026-12-31',
        dateTo: '2026-01-01',
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('dateTo');
    });

    it('should accept dateFrom without dateTo', async () => {
      const dto = plainToInstance(FilterClientDto, {
        dateFrom: '2026-01-01',
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should accept dateTo without dateFrom', async () => {
      const dto = plainToInstance(FilterClientDto, {
        dateTo: '2026-12-31',
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should reject non-ISO date strings', async () => {
      const dto = plainToInstance(FilterClientDto, {
        dateFrom: '31/12/2026',
      });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe('pagination defaults', () => {
    it('should default page to 1 and limit to 10', async () => {
      const dto = await transformAndValidate({});
      expect(dto.page).toBe(1);
      expect(dto.limit).toBe(10);
    });

    it('should parse numeric page and limit from strings', async () => {
      const dto = await transformAndValidate({ page: '2', limit: '25' });
      expect(dto.page).toBe(2);
      expect(dto.limit).toBe(25);
    });

    it('should reject page lower than 1', async () => {
      const dto = plainToInstance(FilterClientDto, { page: 0 });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should reject invalid order values', async () => {
      const dto = plainToInstance(FilterClientDto, { order: 'INVALID' });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });
  });
});
