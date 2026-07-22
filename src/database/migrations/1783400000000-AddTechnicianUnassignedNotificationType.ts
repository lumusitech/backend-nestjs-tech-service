import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTechnicianUnassignedNotificationType1783400000000 implements MigrationInterface {
  name = 'AddTechnicianUnassignedNotificationType1783400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE "public"."notifications_type_enum" ADD VALUE IF NOT EXISTS 'work_order.technician_unassigned'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // PostgreSQL doesn't support removing enum values directly
  }
}
