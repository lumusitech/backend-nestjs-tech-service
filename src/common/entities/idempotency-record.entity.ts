import { Entity, Column } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { BaseEntity } from './base.entity';

@Entity('idempotency_records')
export class IdempotencyRecord extends BaseEntity {
  @ApiProperty({
    description: 'SHA-256 de userId + method + path + Idempotency-Key',
  })
  @Column({ name: 'key_hash', unique: true })
  keyHash!: string;

  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @Column({ name: 'user_id' })
  userId!: string;

  @ApiProperty({ example: 'POST' })
  @Column()
  method!: string;

  @ApiProperty({ example: '/api/work-orders' })
  @Column()
  path!: string;

  @ApiProperty({ example: 201 })
  @Column({ name: 'response_status', type: 'int' })
  responseStatus!: number;

  @ApiProperty({
    description: 'Respuesta transformada {statusCode, data, timestamp}',
  })
  @Column({ name: 'response_body', type: 'jsonb' })
  responseBody!: Record<string, unknown>;
}
