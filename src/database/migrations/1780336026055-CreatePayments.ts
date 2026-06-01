import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePayments1780336026055 implements MigrationInterface {
  name = 'CreatePayments1780336026055';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."payments_method_enum" AS ENUM('credit_card', 'debit_card', 'cash', 'transfer')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."payments_status_enum" AS ENUM('pending', 'approved', 'rejected', 'refunded', 'cancelled')`,
    );
    await queryRunner.query(
      `CREATE TABLE "payments" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "amount" numeric(10,2) NOT NULL, "currency" character varying NOT NULL DEFAULT 'ARS', "method" "public"."payments_method_enum" NOT NULL, "status" "public"."payments_status_enum" NOT NULL DEFAULT 'pending', "provider" character varying NOT NULL, "provider_payment_id" character varying, "description" character varying, "installment_number" integer NOT NULL DEFAULT '1', "total_installments" integer NOT NULL DEFAULT '1', "due_date" date, "paid_at" TIMESTAMP, "metadata" jsonb, "work_order_id" uuid NOT NULL, CONSTRAINT "PK_197ab7af18c93fbb0c9b28b4a59" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "payments" ADD CONSTRAINT "FK_1e6c3ef82e56da42e89cbd5d77a" FOREIGN KEY ("work_order_id") REFERENCES "work_orders"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "payments" DROP CONSTRAINT "FK_1e6c3ef82e56da42e89cbd5d77a"`,
    );
    await queryRunner.query(`DROP TABLE "payments"`);
    await queryRunner.query(`DROP TYPE "public"."payments_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."payments_method_enum"`);
  }
}
