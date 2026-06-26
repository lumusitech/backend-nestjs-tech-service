import { MigrationInterface, QueryRunner } from "typeorm";

export class Init1782509680956 implements MigrationInterface {
    name = 'Init1782509680956'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "skills" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "name" character varying NOT NULL, "description" character varying, "category" character varying, "is_active" boolean NOT NULL DEFAULT true, CONSTRAINT "UQ_81f05095507fd84aa2769b4a522" UNIQUE ("name"), CONSTRAINT "PK_0d3212120f4ecedf90864d7e298" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "user_skills" ("user_id" uuid NOT NULL, "skill_id" uuid NOT NULL, CONSTRAINT "PK_816eba68a0ca1b837ec15daefc7" PRIMARY KEY ("user_id", "skill_id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_6926002c360291df66bb2c5fde" ON "user_skills"  ("user_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_eb69710b0a00f42fb95fc2ac2f" ON "user_skills"  ("skill_id") `);
        await queryRunner.query(`ALTER TABLE "users" ADD "phone" character varying`);
        await queryRunner.query(`ALTER TABLE "users" ADD "commission" numeric(5,2) DEFAULT '5'`);
        await queryRunner.query(`ALTER TABLE "users" ADD "experience" text`);
        await queryRunner.query(`ALTER TABLE "users" ADD "trustRating" numeric(2,1)`);
        await queryRunner.query(`ALTER TYPE "public"."users_role_enum" ADD VALUE 'seller'`);
        await queryRunner.query(`ALTER TABLE "user_skills" ADD CONSTRAINT "FK_6926002c360291df66bb2c5fdeb" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "user_skills" ADD CONSTRAINT "FK_eb69710b0a00f42fb95fc2ac2f5" FOREIGN KEY ("skill_id") REFERENCES "skills"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_skills" DROP CONSTRAINT "FK_eb69710b0a00f42fb95fc2ac2f5"`);
        await queryRunner.query(`ALTER TABLE "user_skills" DROP CONSTRAINT "FK_6926002c360291df66bb2c5fdeb"`);
        await queryRunner.query(`CREATE TYPE "public"."users_role_enum_old" AS ENUM('admin', 'technician')`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "role" TYPE "public"."users_role_enum_old" USING "role"::"text"::"public"."users_role_enum_old"`);
        await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."users_role_enum_old" RENAME TO "users_role_enum"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "trustRating"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "experience"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "commission"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "phone"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_eb69710b0a00f42fb95fc2ac2f"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_6926002c360291df66bb2c5fde"`);
        await queryRunner.query(`DROP TABLE "user_skills"`);
        await queryRunner.query(`DROP TABLE "skills"`);
    }

}
