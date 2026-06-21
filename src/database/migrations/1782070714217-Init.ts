import { MigrationInterface, QueryRunner } from "typeorm";

export class Init1782070714217 implements MigrationInterface {
    name = 'Init1782070714217'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."inquiries_source_enum" AS ENUM('phone', 'whatsapp', 'email', 'walk_in', 'social_media', 'referral')`);
        await queryRunner.query(`CREATE TYPE "public"."inquiries_status_enum" AS ENUM('new', 'contacted', 'reviewed', 'approved', 'rejected', 'converted')`);
        await queryRunner.query(`CREATE TYPE "public"."inquiries_recommendation_enum" AS ENUM('repair', 'replacement', 'maintenance', 'inspection', 'no_action')`);
        await queryRunner.query(`CREATE TYPE "public"."inquiries_admindecision_enum" AS ENUM('approved', 'rejected', 'pending')`);
        await queryRunner.query(`CREATE TABLE "inquiries" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "client_name" character varying NOT NULL, "client_phone" character varying, "client_email" character varying, "client_address" character varying, "description" text NOT NULL, "source" "public"."inquiries_source_enum" NOT NULL, "status" "public"."inquiries_status_enum" NOT NULL DEFAULT 'new', "priority" character varying, "assigned_to_id" uuid, "created_by_id" uuid NOT NULL, "technician_notes" text, "estimated_cost" numeric(10,2), "estimated_duration" integer, "materials_needed" text, "recommendation" "public"."inquiries_recommendation_enum", "adminDecision" "public"."inquiries_admindecision_enum" NOT NULL DEFAULT 'pending', "admin_notes" text, "work_order_id" uuid, "contacted_at" TIMESTAMP, "reviewed_at" TIMESTAMP, CONSTRAINT "PK_ceacaa439988b25eb9459e694d9" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TYPE "public"."notifications_type_enum" ADD VALUE 'inquiry.created'`);
        await queryRunner.query(`ALTER TYPE "public"."notifications_type_enum" ADD VALUE 'inquiry.assigned'`);
        await queryRunner.query(`ALTER TYPE "public"."notifications_type_enum" ADD VALUE 'inquiry.contacted'`);
        await queryRunner.query(`ALTER TYPE "public"."notifications_type_enum" ADD VALUE 'inquiry.reviewed'`);
        await queryRunner.query(`ALTER TABLE "inquiries" ADD CONSTRAINT "FK_995e2dc40417c2eb16745512bea" FOREIGN KEY ("assigned_to_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "inquiries" ADD CONSTRAINT "FK_d3aa12c00a6795ad0b9f97160cb" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "inquiries" ADD CONSTRAINT "FK_b31b0a83df82ea1241dbc65f03a" FOREIGN KEY ("work_order_id") REFERENCES "work_orders"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "inquiries" DROP CONSTRAINT "FK_b31b0a83df82ea1241dbc65f03a"`);
        await queryRunner.query(`ALTER TABLE "inquiries" DROP CONSTRAINT "FK_d3aa12c00a6795ad0b9f97160cb"`);
        await queryRunner.query(`ALTER TABLE "inquiries" DROP CONSTRAINT "FK_995e2dc40417c2eb16745512bea"`);
        await queryRunner.query(`CREATE TYPE "public"."notifications_type_enum_old" AS ENUM('work_order.created', 'work_order.status_changed', 'work_order.technician_assigned', 'task.created', 'task.completed', 'payment.created', 'payment.approved', 'payment.rejected', 'pending_item.created', 'pending_item.due_today', 'pending_item.overdue')`);
        await queryRunner.query(`ALTER TABLE "notifications" ALTER COLUMN "type" TYPE "public"."notifications_type_enum_old" USING "type"::"text"::"public"."notifications_type_enum_old"`);
        await queryRunner.query(`DROP TYPE "public"."notifications_type_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."notifications_type_enum_old" RENAME TO "notifications_type_enum"`);
        await queryRunner.query(`DROP TABLE "inquiries"`);
        await queryRunner.query(`DROP TYPE "public"."inquiries_admindecision_enum"`);
        await queryRunner.query(`DROP TYPE "public"."inquiries_recommendation_enum"`);
        await queryRunner.query(`DROP TYPE "public"."inquiries_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."inquiries_source_enum"`);
    }

}
