import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSuppliers1780164800000 implements MigrationInterface {
  name = 'CreateSuppliers1780164800000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "suppliers" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "name" character varying NOT NULL, "contact" character varying NOT NULL, "phone" character varying NOT NULL, "email" character varying, "address" character varying NOT NULL, "notes" character varying, "is_active" boolean NOT NULL DEFAULT true, CONSTRAINT "UQ_suppliers_email" UNIQUE ("email"), CONSTRAINT "PK_suppliers_id" PRIMARY KEY ("id"))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "suppliers"`);
  }
}
