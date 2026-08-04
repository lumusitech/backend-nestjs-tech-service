import { validate } from 'class-validator';
import { IsOptional, IsDateString } from 'class-validator';
import { IsDateRangeValid } from './date-range.validator';

class TestDateFilterDto {
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @IsOptional()
  @IsDateString()
  @IsDateRangeValid()
  dateTo?: string;
}

describe('IsDateRangeValid', () => {
  it('should pass when dateFrom is before dateTo', async () => {
    const dto = new TestDateFilterDto();
    dto.dateFrom = '2026-01-01';
    dto.dateTo = '2026-12-31';

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should pass when dateFrom equals dateTo', async () => {
    const dto = new TestDateFilterDto();
    dto.dateFrom = '2026-06-30';
    dto.dateTo = '2026-06-30';

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should fail when dateFrom is after dateTo', async () => {
    const dto = new TestDateFilterDto();
    dto.dateFrom = '2026-12-31';
    dto.dateTo = '2026-01-01';

    const errors = await validate(dto);
    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('dateTo');
    expect(errors[0].constraints).toHaveProperty('isDateRangeValid');
  });

  it('should pass when only dateFrom is provided', async () => {
    const dto = new TestDateFilterDto();
    dto.dateFrom = '2026-01-01';

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should pass when only dateTo is provided', async () => {
    const dto = new TestDateFilterDto();
    dto.dateTo = '2026-12-31';

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should pass when neither date is provided', async () => {
    const dto = new TestDateFilterDto();
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });
});
