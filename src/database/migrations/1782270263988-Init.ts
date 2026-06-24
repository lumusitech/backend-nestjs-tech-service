import { MigrationInterface, QueryRunner } from "typeorm";

export class Init1782270263988 implements MigrationInterface {
    name = 'Init1782270263988'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "work_orders" ADD "work_address" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "work_orders" DROP COLUMN "work_address"`);
    }

}
