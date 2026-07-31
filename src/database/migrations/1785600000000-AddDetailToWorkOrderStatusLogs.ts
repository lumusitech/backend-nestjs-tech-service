import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDetailToWorkOrderStatusLogs1785600000000 implements MigrationInterface {
  name = 'AddDetailToWorkOrderStatusLogs1785600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "work_order_status_logs"
      ADD COLUMN "detail" character varying
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "work_order_status_logs"
      DROP COLUMN "detail"
    `);
  }
}
