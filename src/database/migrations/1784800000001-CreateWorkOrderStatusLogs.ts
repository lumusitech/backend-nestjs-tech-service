import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateWorkOrderStatusLogs1784800000001 implements MigrationInterface {
  name = 'CreateWorkOrderStatusLogs1784800000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "work_order_status_logs" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMP,
        "work_order_id" uuid NOT NULL,
        "from_status" character varying,
        "to_status" character varying NOT NULL,
        "changed_by_user_id" uuid NOT NULL,
        "changed_by_role" character varying NOT NULL,
        "timestamp" TIMESTAMP NOT NULL,
        "duration" integer,
        CONSTRAINT "PK_work_order_status_logs" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      ALTER TABLE "work_order_status_logs"
      ADD CONSTRAINT "FK_work_order_status_logs_work_order"
      FOREIGN KEY ("work_order_id") REFERENCES "work_orders"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "work_order_status_logs"
      ADD CONSTRAINT "FK_work_order_status_logs_user"
      FOREIGN KEY ("changed_by_user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "work_order_status_logs" DROP CONSTRAINT "FK_work_order_status_logs_user"`);
    await queryRunner.query(`ALTER TABLE "work_order_status_logs" DROP CONSTRAINT "FK_work_order_status_logs_work_order"`);
    await queryRunner.query(`DROP TABLE "work_order_status_logs"`);
  }
}
