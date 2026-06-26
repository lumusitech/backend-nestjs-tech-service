import { MigrationInterface, QueryRunner } from 'typeorm';

export class PopulateNotificationMetadata1782500000000 implements MigrationInterface {
  name = 'PopulateNotificationMetadata1782500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Work order / task notifications — set trackingCode from the linked work order
    await queryRunner.query(`
      UPDATE notifications n
      SET metadata = jsonb_build_object('trackingCode', wo.tracking_code, 'priority', 'medium')
      FROM work_orders wo
      WHERE n.reference_id::uuid = wo.id
        AND n.reference_type IN ('work_order', 'task')
        AND n.metadata IS NULL
    `);

    // Payment notifications — set trackingCode from the linked work order
    await queryRunner.query(`
      UPDATE notifications n
      SET metadata = jsonb_build_object('trackingCode', wo.tracking_code, 'amount', 0, 'method', 'unknown')
      FROM work_orders wo
      WHERE n.reference_id::uuid = wo.id
        AND n.reference_type = 'payment'
        AND n.metadata IS NULL
    `);

    // Pending item notifications — set title from the notification title
    await queryRunner.query(`
      UPDATE notifications
      SET metadata = jsonb_build_object('title', title, 'priority', 'medium')
      WHERE reference_type = 'pending_item'
        AND metadata IS NULL
    `);

    // Inquiry notifications — extract client name from message
    await queryRunner.query(`
      UPDATE notifications
      SET metadata = jsonb_build_object(
        'clientName',
        CASE
          WHEN message ~ '^Roberto' THEN 'Roberto Díaz'
          WHEN message ~ 'Laura' THEN 'Laura Fernández'
          WHEN message ~ 'Martín' THEN 'Martín López'
          ELSE trim(split_part(message, ':', 1))
        END
      )
      WHERE reference_type = 'inquiry'
        AND metadata IS NULL
    `);

    console.log('  Notification metadata populated for existing records');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`UPDATE notifications SET metadata = NULL`);
  }
}
