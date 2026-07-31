import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddStatusDetailChangedType1785474367000 implements MigrationInterface {
  name = 'AddStatusDetailChangedType1785474367000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE "public"."notifications_type_enum" ADD VALUE IF NOT EXISTS 'work_order.status_detail_changed'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // PostgreSQL doesn't support removing enum values directly
  }
}
