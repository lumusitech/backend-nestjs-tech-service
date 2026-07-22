import { MigrationInterface, QueryRunner } from "typeorm";

export class AddRequiresDeliveryToServiceTypes1784754320307 implements MigrationInterface {
    name = 'AddRequiresDeliveryToServiceTypes1784754320307'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "service_types" ADD "requires_delivery" boolean NOT NULL DEFAULT false`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "service_types" DROP COLUMN "requires_delivery"`);
    }

}
