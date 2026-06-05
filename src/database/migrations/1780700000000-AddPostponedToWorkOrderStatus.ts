import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPostponedToWorkOrderStatus1780700000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE "public"."work_orders_status_enum" ADD VALUE IF NOT EXISTS 'postponed' BEFORE 'completed'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // PostgreSQL doesn't support removing enum values directly
    // Would need to recreate the type
  }
}
