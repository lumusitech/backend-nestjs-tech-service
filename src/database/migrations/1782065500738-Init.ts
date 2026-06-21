import { MigrationInterface, QueryRunner } from "typeorm";

export class Init1782065500738 implements MigrationInterface {
    name = 'Init1782065500738'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "invoices" DROP CONSTRAINT "FK_invoices_work_order_id"`);
        await queryRunner.query(`ALTER TABLE "invoices" DROP CONSTRAINT "FK_invoices_payment_id"`);
        await queryRunner.query(`ALTER TABLE "notifications" DROP CONSTRAINT "FK_notifications_user_id"`);
        await queryRunner.query(`CREATE TYPE "public"."pending_items_type_enum" AS ENUM('work_order', 'inquiry', 'maintenance', 'follow_up', 'other')`);
        await queryRunner.query(`CREATE TYPE "public"."pending_items_priority_enum" AS ENUM('low', 'medium', 'high', 'urgent')`);
        await queryRunner.query(`CREATE TYPE "public"."pending_items_status_enum" AS ENUM('pending', 'in_progress', 'completed', 'cancelled')`);
        await queryRunner.query(`CREATE TABLE "pending_items" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "title" character varying NOT NULL, "description" text, "due_date" date NOT NULL, "type" "public"."pending_items_type_enum" NOT NULL, "priority" "public"."pending_items_priority_enum" NOT NULL DEFAULT 'medium', "status" "public"."pending_items_status_enum" NOT NULL DEFAULT 'pending', "reference_type" character varying, "reference_id" character varying, "assigned_to_id" uuid, "created_by_id" uuid NOT NULL, "completed_at" TIMESTAMP, CONSTRAINT "PK_77eb717d94b7d01ad838b81fe48" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "user_preferences" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "user_id" uuid NOT NULL, "theme" character varying NOT NULL DEFAULT 'light', "language" character varying NOT NULL DEFAULT 'es', "preferences" jsonb, CONSTRAINT "UQ_458057fa75b66e68a275647da2e" UNIQUE ("user_id"), CONSTRAINT "PK_e8cfb5b31af61cd363a6b6d7c25" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TYPE "public"."notifications_type_enum" ADD VALUE 'pending_item.created'`);
        await queryRunner.query(`ALTER TYPE "public"."notifications_type_enum" ADD VALUE 'pending_item.due_today'`);
        await queryRunner.query(`ALTER TYPE "public"."notifications_type_enum" ADD VALUE 'pending_item.overdue'`);
        await queryRunner.query(`ALTER TABLE "invoices" ADD CONSTRAINT "FK_903956a630ba453be61bb327f6a" FOREIGN KEY ("work_order_id") REFERENCES "work_orders"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "invoices" ADD CONSTRAINT "FK_02781c49b25ceb502571f0315f6" FOREIGN KEY ("payment_id") REFERENCES "payments"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "notifications" ADD CONSTRAINT "FK_9a8a82462cab47c73d25f49261f" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "pending_items" ADD CONSTRAINT "FK_6bf51e7e63468a93075edcc8e8e" FOREIGN KEY ("assigned_to_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "pending_items" ADD CONSTRAINT "FK_414a6453b021decb2db04e9dbd5" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_preferences" ADD CONSTRAINT "FK_458057fa75b66e68a275647da2e" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_preferences" DROP CONSTRAINT "FK_458057fa75b66e68a275647da2e"`);
        await queryRunner.query(`ALTER TABLE "pending_items" DROP CONSTRAINT "FK_414a6453b021decb2db04e9dbd5"`);
        await queryRunner.query(`ALTER TABLE "pending_items" DROP CONSTRAINT "FK_6bf51e7e63468a93075edcc8e8e"`);
        await queryRunner.query(`ALTER TABLE "notifications" DROP CONSTRAINT "FK_9a8a82462cab47c73d25f49261f"`);
        await queryRunner.query(`ALTER TABLE "invoices" DROP CONSTRAINT "FK_02781c49b25ceb502571f0315f6"`);
        await queryRunner.query(`ALTER TABLE "invoices" DROP CONSTRAINT "FK_903956a630ba453be61bb327f6a"`);
        await queryRunner.query(`CREATE TYPE "public"."notifications_type_enum_old" AS ENUM('work_order.created', 'work_order.status_changed', 'work_order.technician_assigned', 'task.created', 'task.completed', 'payment.created', 'payment.approved', 'payment.rejected')`);
        await queryRunner.query(`ALTER TABLE "notifications" ALTER COLUMN "type" TYPE "public"."notifications_type_enum_old" USING "type"::"text"::"public"."notifications_type_enum_old"`);
        await queryRunner.query(`DROP TYPE "public"."notifications_type_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."notifications_type_enum_old" RENAME TO "notifications_type_enum"`);
        await queryRunner.query(`DROP TABLE "user_preferences"`);
        await queryRunner.query(`DROP TABLE "pending_items"`);
        await queryRunner.query(`DROP TYPE "public"."pending_items_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."pending_items_priority_enum"`);
        await queryRunner.query(`DROP TYPE "public"."pending_items_type_enum"`);
        await queryRunner.query(`ALTER TABLE "notifications" ADD CONSTRAINT "FK_notifications_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "invoices" ADD CONSTRAINT "FK_invoices_payment_id" FOREIGN KEY ("payment_id") REFERENCES "payments"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "invoices" ADD CONSTRAINT "FK_invoices_work_order_id" FOREIGN KEY ("work_order_id") REFERENCES "work_orders"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
