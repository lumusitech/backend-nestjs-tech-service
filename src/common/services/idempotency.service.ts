import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { IdempotencyRecord } from '../entities/idempotency-record.entity';

export const IDEMPOTENCY_TTL_MS = 48 * 60 * 60 * 1000;

@Injectable()
export class IdempotencyService {
  constructor(
    @InjectRepository(IdempotencyRecord)
    private readonly repository: Repository<IdempotencyRecord>,
  ) {}

  findByKey(keyHash: string): Promise<IdempotencyRecord | null> {
    return this.repository.findOne({ where: { keyHash } });
  }

  async save(
    record: Pick<
      IdempotencyRecord,
      | 'keyHash'
      | 'userId'
      | 'method'
      | 'path'
      | 'responseStatus'
      | 'responseBody'
    >,
  ): Promise<IdempotencyRecord> {
    const existing = await this.repository.findOne({
      where: { keyHash: record.keyHash },
    });
    if (existing) {
      return existing;
    }
    return this.repository.save(this.repository.create(record));
  }

  isExpired(record: IdempotencyRecord): boolean {
    return Date.now() - record.createdAt.getTime() > IDEMPOTENCY_TTL_MS;
  }

  async remove(record: IdempotencyRecord): Promise<void> {
    await this.repository.remove(record);
  }

  async purgeExpired(): Promise<number> {
    const cutoff = new Date(Date.now() - IDEMPOTENCY_TTL_MS);
    const result = await this.repository.delete({
      createdAt: LessThan(cutoff),
    });
    return result.affected ?? 0;
  }
}
