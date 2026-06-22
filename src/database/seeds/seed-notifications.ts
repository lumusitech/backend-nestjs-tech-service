import { DataSource } from 'typeorm';
import { Notification } from '../../notifications/entities/notification.entity';
import { User } from '../../users/entities/user.entity';
import { WorkOrder } from '../../work-orders/entities/work-order.entity';

interface NotifSeed {
  type: string;
  title: string;
  message: string;
  refType: string;
  refCode: string | null;
  isRead: boolean;
  daysAgo: number;
}

const NOTIFS: NotifSeed[] = [
  { type: 'work_order.created', title: 'Nueva orden de trabajo', message: 'Se creó la orden TS-PC0001 para Juan Pérez — Reparación de PC', refType: 'work_order', refCode: 'TS-PC0001', isRead: false, daysAgo: 0 },
  { type: 'work_order.status_changed', title: 'Orden TS-NB0002 actualizada', message: 'Estado cambiado de Asignada a En Progreso', refType: 'work_order', refCode: 'TS-NB0002', isRead: false, daysAgo: 0 },
  { type: 'payment.approved', title: 'Pago aprobado', message: 'Pago de $85.000 ARS aprobado para TS-PC0001', refType: 'payment', refCode: 'TS-PC0001', isRead: false, daysAgo: 0 },
  { type: 'inquiry.created', title: 'Nueva consulta recibida', message: 'Roberto Díaz: Mi notebook HP no prende desde ayer', refType: 'inquiry', refCode: null, isRead: false, daysAgo: 0 },
  { type: 'pending_item.overdue', title: 'Pendiente vencido', message: 'Verificar garantía de SSD está vencido desde hace 3 días', refType: 'pending_item', refCode: null, isRead: false, daysAgo: -1 },
  { type: 'task.completed', title: 'Tarea completada', message: 'Carlos García completó Instalación de Windows 11 en TS-PC0001', refType: 'task', refCode: 'TS-PC0001', isRead: false, daysAgo: -1 },
  { type: 'inquiry.contacted', title: 'Consulta contactada', message: 'Se contactó a Laura Fernández — Relevamiento realizado', refType: 'inquiry', refCode: null, isRead: false, daysAgo: -1 },
  { type: 'work_order.created', title: 'Nueva orden de trabajo', message: 'Se creó la orden TS-CAM003 para Ana Rodríguez — Instalación de cámaras', refType: 'work_order', refCode: 'TS-CAM003', isRead: true, daysAgo: -2 },
  { type: 'payment.approved', title: 'Pago aprobado', message: 'Pago de $120.000 ARS aprobado para TS-TV0004', refType: 'payment', refCode: 'TS-TV0004', isRead: true, daysAgo: -3 },
  { type: 'pending_item.created', title: 'Nuevo trabajo pendiente', message: 'Se creó Preparar presupuesto para instalación eléctrica', refType: 'pending_item', refCode: null, isRead: true, daysAgo: -4 },
  { type: 'task.created', title: 'Nueva tarea', message: 'Tarea Diagnóstico de fuente creada en orden TS-PC0008', refType: 'task', refCode: 'TS-PC0008', isRead: true, daysAgo: -5 },
  { type: 'payment.rejected', title: 'Pago rechazado', message: 'El pago de $25.000 ARS fue rechazado para TS-PC0008', refType: 'payment', refCode: 'TS-PC0008', isRead: true, daysAgo: -5 },
  { type: 'inquiry.reviewed', title: 'Consulta aprobada', message: 'La consulta de Martín López fue aprobada', refType: 'inquiry', refCode: null, isRead: true, daysAgo: -6 },
  { type: 'pending_item.due_today', title: 'Pendiente vence hoy', message: 'Pedir panel de reemplazo para TV vence hoy', refType: 'pending_item', refCode: null, isRead: true, daysAgo: -7 },
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

  const d = (n: number) => {
    const x = new Date();
    x.setDate(x.getDate() + n);
    x.setHours(x.getHours() - Math.floor(Math.random() * 12));
    return x;
  };

  for (const seed of NOTIFS) {
    const referenceId = seed.refCode ? woMap.get(seed.refCode) || null : null;

    const notification = repo.create({
      type: seed.type as any,
      title: seed.title,
      message: seed.message,
      userId: admin.id,
      referenceId,
      referenceType: seed.refType,
      isRead: seed.isRead,
      readAt: seed.isRead ? d(seed.daysAgo) : null,
      createdAt: d(seed.daysAgo),
    } as any);

    await repo.save(notification);
  }

  const unread = NOTIFS.filter((n) => !n.isRead).length;
  const read = NOTIFS.filter((n) => n.isRead).length;
  console.log(`  Notifications seeded: ${NOTIFS.length} (${unread} unread, ${read} read)`);
}
