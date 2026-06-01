import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateExpenses1780420000000 implements MigrationInterface {
  name = 'CreateExpenses1780420000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."expenses_category_enum" AS ENUM('rent', 'utilities', 'salaries', 'tools', 'transport', 'advertising', 'supplies', 'maintenance', 'hosting', 'other')`,
    );
    await queryRunner.query(
      `CREATE TABLE "expenses" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "description" character varying NOT NULL, "amount" numeric(10,2) NOT NULL, "date" date NOT NULL, "category" "public"."expenses_category_enum" NOT NULL, "is_recurring" boolean NOT NULL DEFAULT false, "notes" text, CONSTRAINT "PK_94e5438bf3d422da3b4f0e810d7" PRIMARY KEY ("id"))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "expenses"`);
    await queryRunner.query(`DROP TYPE "public"."expenses_category_enum"`);
  }
}
