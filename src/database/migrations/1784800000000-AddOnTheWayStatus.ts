import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddOnTheWayStatus1784800000000 implements MigrationInterface {
  name = 'AddOnTheWayStatus1784800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE "public"."work_orders_status_enum" ADD VALUE IF NOT EXISTS 'on_the_way'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // PostgreSQL doesn't support removing enum values directly
  }
}
