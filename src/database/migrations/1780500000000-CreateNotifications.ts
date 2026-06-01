import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateNotifications1780500000000 implements MigrationInterface {
  name = 'CreateNotifications1780500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."notifications_type_enum" AS ENUM('work_order.created', 'work_order.status_changed', 'work_order.technician_assigned', 'task.created', 'task.completed', 'payment.created', 'payment.approved', 'payment.rejected')`,
    );
    await queryRunner.query(
      `CREATE TABLE "notifications" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "type" "public"."notifications_type_enum" NOT NULL, "title" character varying NOT NULL, "message" text NOT NULL, "user_id" uuid NOT NULL, "reference_id" character varying, "reference_type" character varying, "metadata" jsonb, "is_read" boolean NOT NULL DEFAULT false, "read_at" TIMESTAMP, CONSTRAINT "PK_6a795f99b3f8999999999999999" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "notifications" ADD CONSTRAINT "FK_notifications_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "notifications" DROP CONSTRAINT "FK_notifications_user_id"`,
    );
    await queryRunner.query(`DROP TABLE "notifications"`);
    await queryRunner.query(`DROP TYPE "public"."notifications_type_enum"`);
  }
}
