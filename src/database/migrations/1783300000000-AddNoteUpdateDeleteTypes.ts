import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddNoteUpdateDeleteTypes1783300000000
  implements MigrationInterface
{
  name = 'AddNoteUpdateDeleteTypes1783300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE "public"."notifications_type_enum" ADD VALUE IF NOT EXISTS 'work_order.note_updated'`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."notifications_type_enum" ADD VALUE IF NOT EXISTS 'work_order.note_deleted'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // PostgreSQL doesn't support removing enum values directly
  }
}
