import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateIdempotencyRecords1786764000000 implements MigrationInterface {
  name = 'CreateIdempotencyRecords1786764000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "idempotency_records" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "key_hash" character varying NOT NULL, "user_id" uuid NOT NULL, "method" character varying NOT NULL, "path" character varying NOT NULL, "response_status" integer NOT NULL, "response_body" jsonb NOT NULL, CONSTRAINT "UQ_idempotency_records_key_hash" UNIQUE ("key_hash"), CONSTRAINT "PK_idempotency_records_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_idempotency_records_user_id" ON "idempotency_records" ("user_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_idempotency_records_created_at" ON "idempotency_records" ("created_at")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_idempotency_records_created_at"`);
    await queryRunner.query(`DROP INDEX "IDX_idempotency_records_user_id"`);
    await queryRunner.query(`DROP TABLE "idempotency_records"`);
  }
}
