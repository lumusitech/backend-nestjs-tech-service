import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { FilterServiceTypeDto } from './filter-service-type.dto';

async function transformAndValidate(
  params: Record<string, unknown>,
): Promise<FilterServiceTypeDto> {
  const dto = plainToInstance(FilterServiceTypeDto, params);
  await validate(dto);
  return dto;
}

describe('FilterServiceTypeDto', () => {
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

    it('should leave isActive undefined when not provided', async () => {
      const dto = await transformAndValidate({});
      expect(dto.isActive).toBeUndefined();
    });
  });

  describe('date range validation', () => {
    it('should accept valid dateFrom and dateTo', async () => {
      const dto = plainToInstance(FilterServiceTypeDto, { dateFrom: '2026-01-01', dateTo: '2026-12-31' });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should reject dateFrom after dateTo', async () => {
      const dto = plainToInstance(FilterServiceTypeDto, { dateFrom: '2026-12-31', dateTo: '2026-01-01' });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
    });

    it('should accept dateFrom without dateTo', async () => {
      const dto = plainToInstance(FilterServiceTypeDto, { dateFrom: '2026-01-01' });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should accept dateTo without dateFrom', async () => {
      const dto = plainToInstance(FilterServiceTypeDto, { dateTo: '2026-12-31' });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });
  });
});
