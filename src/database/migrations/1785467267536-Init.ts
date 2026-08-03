import { MigrationInterface, QueryRunner } from 'typeorm';

export class Init1785467267536 implements MigrationInterface {
  name = 'Init1785467267536';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "work_order_status_logs" DROP CONSTRAINT "FK_work_order_status_logs_work_order"`,
    );
    await queryRunner.query(
      `ALTER TABLE "work_order_status_logs" DROP CONSTRAINT "FK_work_order_status_logs_user"`,
    );
    await queryRunner.query(
      `ALTER TABLE "work_order_status_logs" ADD CONSTRAINT "FK_7d86ff9a065ab532832b22c81d0" FOREIGN KEY ("work_order_id") REFERENCES "work_orders"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "work_order_status_logs" ADD CONSTRAINT "FK_80db0e2c2bb53c3886dd6394f27" FOREIGN KEY ("changed_by_user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "work_order_status_logs" DROP CONSTRAINT "FK_80db0e2c2bb53c3886dd6394f27"`,
    );
    await queryRunner.query(
      `ALTER TABLE "work_order_status_logs" DROP CONSTRAINT "FK_7d86ff9a065ab532832b22c81d0"`,
    );
    await queryRunner.query(
      `ALTER TABLE "work_order_status_logs" ADD CONSTRAINT "FK_work_order_status_logs_user" FOREIGN KEY ("changed_by_user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "work_order_status_logs" ADD CONSTRAINT "FK_work_order_status_logs_work_order" FOREIGN KEY ("work_order_id") REFERENCES "work_orders"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }
}
