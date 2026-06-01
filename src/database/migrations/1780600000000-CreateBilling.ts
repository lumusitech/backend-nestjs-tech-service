import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateBilling1780600000000 implements MigrationInterface {
  name = 'CreateBilling1780600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."invoices_invoice_type_enum" AS ENUM('A', 'B', 'C')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."invoices_concept_enum" AS ENUM('products', 'services', 'both')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."invoices_status_enum" AS ENUM('draft', 'issued', 'cancelled', 'rejected')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."invoices_client_iva_condition_enum" AS ENUM('responsable_inscripto', 'consumidor_final', 'monotributo', 'exento')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."clients_iva_condition_enum" AS ENUM('responsable_inscripto', 'consumidor_final', 'monotributo', 'exento')`,
    );

    await queryRunner.query(
      `CREATE TABLE "invoices" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMP,
        "invoice_number" character varying NOT NULL,
        "invoice_type" "public"."invoices_invoice_type_enum" NOT NULL,
        "point_of_sale" integer NOT NULL DEFAULT 1,
        "concept" "public"."invoices_concept_enum" NOT NULL DEFAULT 'services',
        "status" "public"."invoices_status_enum" NOT NULL DEFAULT 'draft',
        "cae" character varying,
        "cae_expiry" date,
        "issued_at" TIMESTAMP,
        "cancelled_at" TIMESTAMP,
        "client_name" character varying NOT NULL,
        "client_cuit" character varying,
        "client_address" character varying NOT NULL,
        "client_iva_condition" "public"."invoices_client_iva_condition_enum" NOT NULL DEFAULT 'consumidor_final',
        "subtotal" decimal(10,2) NOT NULL,
        "iva_amount" decimal(10,2) NOT NULL DEFAULT 0,
        "total" decimal(10,2) NOT NULL,
        "work_order_id" uuid NOT NULL,
        "payment_id" uuid,
        "metadata" jsonb,
        CONSTRAINT "PK_invoices_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_invoices_invoice_number" UNIQUE ("invoice_number")
      )`,
    );

    await queryRunner.query(
      `ALTER TABLE "invoices" ADD CONSTRAINT "FK_invoices_work_order_id" FOREIGN KEY ("work_order_id") REFERENCES "work_orders"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "invoices" ADD CONSTRAINT "FK_invoices_payment_id" FOREIGN KEY ("payment_id") REFERENCES "payments"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );

    await queryRunner.query(
      `ALTER TABLE "clients" ADD "cuit" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "clients" ADD "iva_condition" "public"."clients_iva_condition_enum"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "clients" DROP COLUMN "iva_condition"`,
    );
    await queryRunner.query(`ALTER TABLE "clients" DROP COLUMN "cuit"`);

    await queryRunner.query(
      `ALTER TABLE "invoices" DROP CONSTRAINT "FK_invoices_payment_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "invoices" DROP CONSTRAINT "FK_invoices_work_order_id"`,
    );

    await queryRunner.query(`DROP TABLE "invoices"`);
    await queryRunner.query(`DROP TYPE "public"."clients_iva_condition_enum"`);
    await queryRunner.query(
      `DROP TYPE "public"."invoices_client_iva_condition_enum"`,
    );
    await queryRunner.query(`DROP TYPE "public"."invoices_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."invoices_concept_enum"`);
    await queryRunner.query(`DROP TYPE "public"."invoices_invoice_type_enum"`);
  }
}
