import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { FilterNotificationDto } from './filter-notification.dto';

async function transformAndValidate(
  params: Record<string, unknown>,
): Promise<FilterNotificationDto> {
  const dto = plainToInstance(FilterNotificationDto, params);
  await validate(dto);
  return dto;
}

describe('FilterNotificationDto', () => {
  describe('isRead boolean transform', () => {
    it('should parse "true" string to boolean true', async () => {
      const dto = await transformAndValidate({ isRead: 'true' });
      expect(dto.isRead).toBe(true);
    });

    it('should parse "false" string to boolean false', async () => {
      const dto = await transformAndValidate({ isRead: 'false' });
      expect(dto.isRead).toBe(false);
    });

    it('should keep boolean false as false', async () => {
      const dto = await transformAndValidate({ isRead: false });
      expect(dto.isRead).toBe(false);
    });

    it('should leave isRead undefined when not provided', async () => {
      const dto = await transformAndValidate({});
      expect(dto.isRead).toBeUndefined();
    });
  });

  describe('type validation', () => {
    it('should reject invalid notification types', async () => {
      const dto = plainToInstance(FilterNotificationDto, {
        type: 'INVALID',
      });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });
  });
});
