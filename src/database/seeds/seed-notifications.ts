import { DataSource } from 'typeorm';
import { Notification } from '../../notifications/entities/notification.entity';
import { NotificationType } from '../../notifications/enums/notification-type.enum';
import { User } from '../../users/entities/user.entity';
import { WorkOrder } from '../../work-orders/entities/work-order.entity';

interface NotifSeed {
  type: NotificationType;
  title: string;
  message: string;
  refType: string;
  refCode: string | null;
  isRead: boolean;
  daysAgo: number;
  metadata?: Record<string, unknown>;
}

const NOTIFS: NotifSeed[] = [
  {
    type: NotificationType.WORK_ORDER_CREATED,
    title: 'Nueva orden de trabajo',
    message: 'Se creó la orden TS-PC0001 para Juan Pérez — Reparación de PC',
    refType: 'work_order',
    refCode: 'TS-PC0001',
    isRead: false,
    daysAgo: 0,
    metadata: { trackingCode: 'TS-PC0001', priority: 'high' },
  },
  {
    type: NotificationType.WORK_ORDER_STATUS_CHANGED,
    title: 'Orden TS-NB0002 actualizada',
    message: 'Estado cambiado de Asignada a En Progreso',
    refType: 'work_order',
    refCode: 'TS-NB0002',
    isRead: false,
    daysAgo: 0,
    metadata: {
      trackingCode: 'TS-NB0002',
      oldStatus: 'assigned',
      newStatus: 'in_progress',
    },
  },
  {
    type: NotificationType.PAYMENT_APPROVED,
    title: 'Pago aprobado',
    message: 'Pago de $85.000 ARS aprobado para TS-PC0001',
    refType: 'payment',
    refCode: 'TS-PC0001',
    isRead: false,
    daysAgo: 0,
    metadata: { trackingCode: 'TS-PC0001', amount: 85000, method: 'transfer' },
  },
  {
    type: NotificationType.INQUIRY_CREATED,
    title: 'Nueva consulta recibida',
    message: 'Roberto Díaz: Mi notebook HP no prende desde ayer',
    refType: 'inquiry',
    refCode: null,
    isRead: false,
    daysAgo: 0,
    metadata: { clientName: 'Roberto Díaz', source: 'phone' },
  },
  {
    type: NotificationType.PENDING_ITEM_OVERDUE,
    title: 'Pendiente vencido',
    message: 'Verificar garantía de SSD está vencido desde hace 3 días',
    refType: 'pending_item',
    refCode: null,
    isRead: false,
    daysAgo: -1,
    metadata: { title: 'Verificar garantía de SSD', priority: 'high' },
  },
  {
    type: NotificationType.TASK_COMPLETED,
    title: 'Tarea completada',
    message: 'Carlos García completó Instalación de Windows 11 en TS-PC0001',
    refType: 'task',
    refCode: 'TS-PC0001',
    isRead: false,
    daysAgo: -1,
    metadata: {
      trackingCode: 'TS-PC0001',
      taskTitle: 'Instalación de Windows 11',
      technicianName: 'Carlos García',
    },
  },
  {
    type: NotificationType.INQUIRY_CONTACTED,
    title: 'Consulta contactada',
    message: 'Se contactó a Laura Fernández — Relevamiento realizado',
    refType: 'inquiry',
    refCode: null,
    isRead: false,
    daysAgo: -1,
    metadata: { clientName: 'Laura Fernández' },
  },
  {
    type: NotificationType.WORK_ORDER_CREATED,
    title: 'Nueva orden de trabajo',
    message:
      'Se creó la orden TS-CAM003 para Ana Rodríguez — Instalación de cámaras',
    refType: 'work_order',
    refCode: 'TS-CAM003',
    isRead: true,
    daysAgo: -2,
    metadata: { trackingCode: 'TS-CAM003', priority: 'medium' },
  },
  {
    type: NotificationType.PAYMENT_APPROVED,
    title: 'Pago aprobado',
    message: 'Pago de $120.000 ARS aprobado para TS-TV0004',
    refType: 'payment',
    refCode: 'TS-TV0004',
    isRead: true,
    daysAgo: -3,
    metadata: { trackingCode: 'TS-TV0004', amount: 120000, method: 'cash' },
  },
  {
    type: NotificationType.PENDING_ITEM_CREATED,
    title: 'Nuevo trabajo pendiente',
    message: 'Se creó Preparar presupuesto para instalación eléctrica',
    refType: 'pending_item',
    refCode: null,
    isRead: true,
    daysAgo: -4,
    metadata: {
      title: 'Preparar presupuesto para instalación eléctrica',
      priority: 'medium',
    },
  },
  {
    type: NotificationType.TASK_CREATED,
    title: 'Nueva tarea',
    message: 'Tarea Diagnóstico de fuente creada en orden TS-PC0008',
    refType: 'task',
    refCode: 'TS-PC0008',
    isRead: true,
    daysAgo: -5,
    metadata: { trackingCode: 'TS-PC0008', taskTitle: 'Diagnóstico de fuente' },
  },
  {
    type: NotificationType.PAYMENT_REJECTED,
    title: 'Pago rechazado',
    message: 'El pago de $25.000 ARS fue rechazado para TS-PC0008',
    refType: 'payment',
    refCode: 'TS-PC0008',
    isRead: true,
    daysAgo: -5,
    metadata: {
      trackingCode: 'TS-PC0008',
      amount: 25000,
      method: 'credit_card',
    },
  },
  {
    type: NotificationType.INQUIRY_REVIEWED,
    title: 'Consulta aprobada',
    message: 'La consulta de Martín López fue aprobada',
    refType: 'inquiry',
    refCode: null,
    isRead: true,
    daysAgo: -6,
    metadata: { clientName: 'Martín López' },
  },
  {
    type: NotificationType.PENDING_ITEM_DUE_TODAY,
    title: 'Pendiente vence hoy',
    message: 'Pedir panel de reemplazo para TV vence hoy',
    refType: 'pending_item',
    refCode: null,
    isRead: true,
    daysAgo: -7,
    metadata: { title: 'Pedir panel de reemplazo para TV', priority: 'low' },
  },
  {
    type: NotificationType.WORK_ORDER_STATUS_DETAIL_CHANGED,
    title: 'Detalle de timeline actualizado',
    message: 'Se actualizó el detalle del estado Entregado en TS-PC0001',
    refType: 'work_order',
    refCode: 'TS-PC0001',
    isRead: false,
    daysAgo: 0,
    metadata: {
      trackingCode: 'TS-PC0001',
      status: 'delivered',
      statusDetail: 'Equipo entregado al cliente con garantía de 6 meses',
    },
  },
  {
    type: NotificationType.WORK_ORDER_MATERIAL_ADDED,
    title: 'Material agregado',
    message: 'Se agregó el material Display LCD 15.6" a la orden TS-NB0002',
    refType: 'work_order',
    refCode: 'TS-NB0002',
    isRead: false,
    daysAgo: 0,
    metadata: {
      trackingCode: 'TS-NB0002',
      description: 'Display LCD 15.6" HP Pavilion',
      quantity: 1,
      unitCost: 85000,
    },
  },
  {
    type: NotificationType.WORK_ORDER_NOTE_ADDED,
    title: 'Nota agregada',
    message: 'Nueva nota de diagnóstico agregada a la orden TS-NB0002',
    refType: 'work_order',
    refCode: 'TS-NB0002',
    isRead: false,
    daysAgo: -1,
    metadata: {
      trackingCode: 'TS-NB0002',
      noteType: 'diagnosis',
    },
  },
];

export async function seedNotifications(dataSource: DataSource): Promise<void> {
  const repo = dataSource.getRepository(Notification);
  const userRepo = dataSource.getRepository(User);
  const woRepo = dataSource.getRepository(WorkOrder);

  const existing = await repo.count();
  if (existing > 0) {
    console.log(`  Notifications already exist: ${existing}`);
    return;
  }

  const admin = await userRepo.findOne({
    where: { email: 'admin@techservice.local' },
    select: { id: true },
  });

  if (!admin) {
    console.warn('  Admin user not found, skipping notifications seed');
    return;
  }

  const workOrders = await woRepo.find({
    select: { id: true, trackingCode: true },
    take: 10,
  });
  const woMap = new Map(workOrders.map((wo) => [wo.trackingCode, wo.id]));

  // Also fetch payments to get their IDs
  const payments = await dataSource.query<
    Array<{ id: string; tracking_code: string | null }>
  >(
    'SELECT p.id, wo.tracking_code FROM payments p LEFT JOIN work_orders wo ON p.work_order_id = wo.id',
  );
  const payMap = new Map<string, string>(
    payments.map((p) => [p.tracking_code ?? '', p.id]),
  );

  const d = (n: number) => {
    const x = new Date();
    x.setDate(x.getDate() + n);
    x.setHours(x.getHours() - Math.floor(Math.random() * 12));
    return x;
  };

  for (const seed of NOTIFS) {
    let referenceId: string | null;
    if (seed.refType === 'payment') {
      referenceId = seed.refCode ? payMap.get(seed.refCode) || null : null;
    } else {
      referenceId = seed.refCode ? woMap.get(seed.refCode) || null : null;
    }

    const notification = repo.create({
      type: seed.type,
      title: seed.title,
      message: seed.message,
      userId: admin.id,
      referenceId: referenceId ?? undefined,
      referenceType: seed.refType,
      metadata: seed.metadata ?? undefined,
      isRead: seed.isRead,
      readAt: seed.isRead ? d(seed.daysAgo) : undefined,
      createdAt: d(seed.daysAgo),
    });

    await repo.save(notification);
  }

  const unread = NOTIFS.filter((n) => !n.isRead).length;
  const read = NOTIFS.filter((n) => n.isRead).length;
  console.log(
    `  Notifications seeded: ${NOTIFS.length} (${unread} unread, ${read} read)`,
  );
}
