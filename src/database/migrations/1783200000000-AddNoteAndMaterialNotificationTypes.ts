import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddNoteAndMaterialNotificationTypes1783200000000
  implements MigrationInterface
{
  name = 'AddNoteAndMaterialNotificationTypes1783200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE "public"."notifications_type_enum" ADD VALUE IF NOT EXISTS 'work_order.note_added'`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."notifications_type_enum" ADD VALUE IF NOT EXISTS 'work_order.material_added'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // PostgreSQL doesn't support removing enum values directly
  }
}
