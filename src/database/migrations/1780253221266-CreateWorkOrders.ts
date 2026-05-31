import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateWorkOrders1780253221266 implements MigrationInterface {
  name = 'CreateWorkOrders1780253221266';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."work_order_notes_type_enum" AS ENUM('diagnosis', 'issue', 'observation', 'internal')`,
    );
    await queryRunner.query(
      `CREATE TABLE "work_order_notes" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "type" "public"."work_order_notes_type_enum" NOT NULL, "content" character varying NOT NULL, "work_order_id" uuid NOT NULL, CONSTRAINT "PK_f668bfc0a20e1ed17a5fac63bf0" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."work_orders_status_enum" AS ENUM('pending', 'assigned', 'in_progress', 'completed', 'delivered', 'cancelled')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."work_orders_priority_enum" AS ENUM('low', 'medium', 'high', 'urgent')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."work_orders_location_enum" AS ENUM('on_site', 'workshop')`,
    );
    await queryRunner.query(
      `CREATE TABLE "work_orders" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "tracking_code" character varying NOT NULL, "status" "public"."work_orders_status_enum" NOT NULL DEFAULT 'pending', "priority" "public"."work_orders_priority_enum" NOT NULL DEFAULT 'medium', "location" "public"."work_orders_location_enum" NOT NULL DEFAULT 'workshop', "diagnosis" character varying, "warranty_until" date, "scheduled_date" date, "started_at" TIMESTAMP, "completed_at" TIMESTAMP, "client_id" uuid NOT NULL, "service_type_id" uuid NOT NULL, CONSTRAINT "UQ_dcadd2284321c75b3670875444f" UNIQUE ("tracking_code"), CONSTRAINT "PK_29f6c1884082ee6f535aed93660" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "work_order_materials" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "description" character varying NOT NULL, "quantity" numeric(10,2) NOT NULL, "unit_cost" numeric(10,2) NOT NULL, "work_order_id" uuid NOT NULL, "supplier_id" uuid, CONSTRAINT "PK_ef5cf27418c13b17bdf514e58f8" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "work_order_technicians" ("work_order_id" uuid NOT NULL, "user_id" uuid NOT NULL, CONSTRAINT "PK_8bf3716715e2da32dd0e0f69b25" PRIMARY KEY ("work_order_id", "user_id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_aabceb2324c13810a00205063c" ON "work_order_technicians"  ("work_order_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_d71e315e62e52a0a801345ee2d" ON "work_order_technicians"  ("user_id") `,
    );
    await queryRunner.query(`ALTER TABLE "clients" ADD "deleted_at" TIMESTAMP`);
    await queryRunner.query(
      `ALTER TABLE "suppliers" ADD "deleted_at" TIMESTAMP`,
    );
    await queryRunner.query(
      `ALTER TABLE "service_types" ADD "deleted_at" TIMESTAMP`,
    );
    await queryRunner.query(`ALTER TABLE "users" ADD "deleted_at" TIMESTAMP`);
    await queryRunner.query(
      `ALTER TABLE "work_order_notes" ADD CONSTRAINT "FK_d64d6f44624e8fd470e386a3adb" FOREIGN KEY ("work_order_id") REFERENCES "work_orders"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "work_orders" ADD CONSTRAINT "FK_8e6f21ef2e09a977e62e74a29fa" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "work_orders" ADD CONSTRAINT "FK_da419b830d280d80a5c63355836" FOREIGN KEY ("service_type_id") REFERENCES "service_types"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "work_order_materials" ADD CONSTRAINT "FK_259c6f46d9485959a5912a4b678" FOREIGN KEY ("work_order_id") REFERENCES "work_orders"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "work_order_materials" ADD CONSTRAINT "FK_1f2e7d27894b203201bdd713366" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "work_order_technicians" ADD CONSTRAINT "FK_aabceb2324c13810a00205063c4" FOREIGN KEY ("work_order_id") REFERENCES "work_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "work_order_technicians" ADD CONSTRAINT "FK_d71e315e62e52a0a801345ee2d8" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "work_order_technicians" DROP CONSTRAINT "FK_d71e315e62e52a0a801345ee2d8"`,
    );
    await queryRunner.query(
      `ALTER TABLE "work_order_technicians" DROP CONSTRAINT "FK_aabceb2324c13810a00205063c4"`,
    );
    await queryRunner.query(
      `ALTER TABLE "work_order_materials" DROP CONSTRAINT "FK_1f2e7d27894b203201bdd713366"`,
    );
    await queryRunner.query(
      `ALTER TABLE "work_order_materials" DROP CONSTRAINT "FK_259c6f46d9485959a5912a4b678"`,
    );
    await queryRunner.query(
      `ALTER TABLE "work_orders" DROP CONSTRAINT "FK_da419b830d280d80a5c63355836"`,
    );
    await queryRunner.query(
      `ALTER TABLE "work_orders" DROP CONSTRAINT "FK_8e6f21ef2e09a977e62e74a29fa"`,
    );
    await queryRunner.query(
      `ALTER TABLE "work_order_notes" DROP CONSTRAINT "FK_d64d6f44624e8fd470e386a3adb"`,
    );
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "deleted_at"`);
    await queryRunner.query(
      `ALTER TABLE "service_types" DROP COLUMN "deleted_at"`,
    );
    await queryRunner.query(`ALTER TABLE "suppliers" DROP COLUMN "deleted_at"`);
    await queryRunner.query(`ALTER TABLE "clients" DROP COLUMN "deleted_at"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_d71e315e62e52a0a801345ee2d"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_aabceb2324c13810a00205063c"`,
    );
    await queryRunner.query(`DROP TABLE "work_order_technicians"`);
    await queryRunner.query(`DROP TABLE "work_order_materials"`);
    await queryRunner.query(`DROP TABLE "work_orders"`);
    await queryRunner.query(`DROP TYPE "public"."work_orders_location_enum"`);
    await queryRunner.query(`DROP TYPE "public"."work_orders_priority_enum"`);
    await queryRunner.query(`DROP TYPE "public"."work_orders_status_enum"`);
    await queryRunner.query(`DROP TABLE "work_order_notes"`);
    await queryRunner.query(`DROP TYPE "public"."work_order_notes_type_enum"`);
  }
}
