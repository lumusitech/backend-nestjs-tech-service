import { MigrationInterface, QueryRunner } from "typeorm";

export class Init1782401353531 implements MigrationInterface {
    name = 'Init1782401353531'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "business_settings" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "business_name" character varying NOT NULL DEFAULT 'Tech Service', "logo_url" character varying, "primary_color" character varying, "secondary_color" character varying, "address" character varying, "phone" character varying, "email" character varying, CONSTRAINT "PK_be550d64549bda4778cf6f9e0df" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "business_settings"`);
    }

}
