import { Entity, Column, Index } from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BaseEntity } from '../../common/entities/base.entity';

@Entity('refresh_tokens')
@Index(['userId'])
@Index(['expiresAt'])
export class RefreshToken extends BaseEntity {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @Column({ name: 'user_id' })
  userId!: string;

  @ApiProperty({
    description: 'SHA-256 hash del refresh token (nunca el token crudo)',
  })
  @Column({ name: 'token_hash', unique: true })
  tokenHash!: string;

  @ApiProperty({ example: '2026-08-29T12:00:00.000Z' })
  @Column({ name: 'expires_at', type: 'timestamptz' })
  expiresAt!: Date;

  @ApiPropertyOptional({ example: '2026-08-15T12:00:00.000Z' })
  @Column({ name: 'revoked_at', type: 'timestamptz', nullable: true })
  revokedAt?: Date | null;
}
