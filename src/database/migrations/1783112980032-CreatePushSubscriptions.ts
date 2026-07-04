import { MigrationInterface, QueryRunner } from "typeorm";

export class CreatePushSubscriptions1783112980032 implements MigrationInterface {
    name = 'CreatePushSubscriptions1783112980032'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "push_subscriptions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "endpoint" character varying NOT NULL, "p256dh" character varying NOT NULL, "auth" character varying NOT NULL, "user_id" uuid NOT NULL, "user_agent" character varying, CONSTRAINT "PK_757fc8f00c34f66832668dc2e53" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "push_subscriptions" ADD CONSTRAINT "FK_6771f119f1c06d2ccf38f238664" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "push_subscriptions" DROP CONSTRAINT "FK_6771f119f1c06d2ccf38f238664"`);
        await queryRunner.query(`DROP TABLE "push_subscriptions"`);
    }

}
