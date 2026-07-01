import { MigrationInterface, QueryRunner } from "typeorm";

export class AddAvatarToUser1782931236006 implements MigrationInterface {
    name = 'AddAvatarToUser1782931236006'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD "avatar" text`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "avatar"`);
    }

}
