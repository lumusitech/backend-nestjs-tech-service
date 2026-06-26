import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSellerToWorkOrders1782509987961 implements MigrationInterface {
    name = 'AddSellerToWorkOrders1782509987961'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "work_orders" ADD "commission_percent" numeric(5,2) NOT NULL DEFAULT '5'`);
        await queryRunner.query(`ALTER TABLE "work_orders" ADD "seller_id" uuid`);
        await queryRunner.query(`ALTER TABLE "work_orders" ADD CONSTRAINT "FK_ec1bc46ac0e1540d9b4afbb2567" FOREIGN KEY ("seller_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "work_orders" DROP CONSTRAINT "FK_ec1bc46ac0e1540d9b4afbb2567"`);
        await queryRunner.query(`ALTER TABLE "work_orders" DROP COLUMN "seller_id"`);
        await queryRunner.query(`ALTER TABLE "work_orders" DROP COLUMN "commission_percent"`);
    }

}
