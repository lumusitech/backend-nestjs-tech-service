import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateServiceTypes1780251224948 implements MigrationInterface {
  name = 'CreateServiceTypes1780251224948';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "service_types" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "name" character varying NOT NULL, "description" character varying, "estimated_duration" integer, "is_active" boolean NOT NULL DEFAULT true, CONSTRAINT "UQ_7dadebaed69653520aa93bbc84d" UNIQUE ("name"), CONSTRAINT "PK_1dc93417a097cdee3491f39d7cc" PRIMARY KEY ("id"))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "service_types"`);
  }
}
