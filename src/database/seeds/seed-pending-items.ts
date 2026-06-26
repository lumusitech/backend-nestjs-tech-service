import { DataSource } from 'typeorm';
import { PendingItem } from '../../pending-items/entities/pending-item.entity';
import { PendingItemType } from '../../pending-items/enums/pending-item-type.enum';
import { PendingItemPriority } from '../../pending-items/enums/pending-item-priority.enum';
import { PendingItemStatus } from '../../pending-items/enums/pending-item-status.enum';
import { User } from '../../users/entities/user.entity';
import { WorkOrder } from '../../work-orders/entities/work-order.entity';

interface PendingItemSeed {
  title: string;
  description: string;
  dueDate: string;
  type: PendingItemType;
  priority: PendingItemPriority;
  status: PendingItemStatus;
  referenceType: string | null;
  trackingCode: string | null;
  assignedToEmail: string | null;
  createdByEmail: string;
  completedAt: string | null;
}

const PENDING_ITEMS: PendingItemSeed[] = [
  {
    title: 'Verificar garantía de SSD reemplazado',
    description:
      'Confirmar con proveedor si el SSD Kingston 480GB tiene garantía de 3 años o 5 años. Guardar factura.',
    dueDate: '2026-06-18',
    type: PendingItemType.WORK_ORDER,
    priority: PendingItemPriority.LOW,
    status: PendingItemStatus.PENDING,
    referenceType: 'work_order',
    trackingCode: 'TS-PC0001',
    assignedToEmail: 'carlos.garcia@techservice.local',
    createdByEmail: 'admin@techservice.local',
    completedAt: null,
  },
  {
    title: 'Pedir panel de reemplazo para TV',
    description:
      'Contactar proveedor para solicitar panel LED compatible con TV Samsung 55". Verificar precio y tiempo de entrega.',
    dueDate: '2026-06-16',
    type: PendingItemType.WORK_ORDER,
    priority: PendingItemPriority.HIGH,
    status: PendingItemStatus.IN_PROGRESS,
    referenceType: 'work_order',
    trackingCode: 'TS-TV0011',
    assignedToEmail: 'laura.fernandez@techservice.local',
    createdByEmail: 'admin@techservice.local',
    completedAt: null,
  },
  {
    title: 'Completar instalación de cámaras - segunda fase',
    description:
      'Instalar 4 cámaras restantes en el depósito y configurar grabación por detección de movimiento.',
    dueDate: '2026-06-20',
    type: PendingItemType.WORK_ORDER,
    priority: PendingItemPriority.MEDIUM,
    status: PendingItemStatus.PENDING,
    referenceType: 'work_order',
    trackingCode: 'TS-CAM003',
    assignedToEmail: 'diego.martinez@techservice.local',
    createdByEmail: 'admin@techservice.local',
    completedAt: null,
  },
  {
    title: 'Reparar cortocircuito - local mostrador',
    description:
      'Reemplazar cableado defectuoso en sector mostrador. Coordinar con el cliente para acceso fuera de horario comercial.',
    dueDate: '2026-06-15',
    type: PendingItemType.WORK_ORDER,
    priority: PendingItemPriority.URGENT,
    status: PendingItemStatus.PENDING,
    referenceType: 'work_order',
    trackingCode: 'TS-EL0005',
    assignedToEmail: 'pablo.sanchez@techservice.local',
    createdByEmail: 'admin@techservice.local',
    completedAt: null,
  },
  {
    title: 'Llamar a cliente para coordinar visita',
    description:
      'Santiago Alvarez dejó un mensaje preguntando por la notebook. Llamar para coordinar diagnóstico en taller.',
    dueDate: '2026-06-17',
    type: PendingItemType.FOLLOW_UP,
    priority: PendingItemPriority.MEDIUM,
    status: PendingItemStatus.PENDING,
    referenceType: null,
    trackingCode: null,
    assignedToEmail: 'maria.lopez@techservice.local',
    createdByEmail: 'admin@techservice.local',
    completedAt: null,
  },
  {
    title: 'Actualizar inventario de repuestos',
    description:
      'Revisar stock de repuestos frecuentes: pantallas notebook, fuentes ATX, discos SSD, módulos RAM. Actualizar lista de precios.',
    dueDate: '2026-06-22',
    type: PendingItemType.MAINTENANCE,
    priority: PendingItemPriority.LOW,
    status: PendingItemStatus.COMPLETED,
    referenceType: null,
    trackingCode: null,
    assignedToEmail: null,
    createdByEmail: 'admin@techservice.local',
    completedAt: '2026-06-22T11:00:00.000Z',
  },
  {
    title: 'Preparar presupuesto para instalación eléctrica',
    description:
      'El cliente Fernando Díaz pidió un presupuesto para la segunda etapa de la instalación eléctrica del local.',
    dueDate: '2026-06-19',
    type: PendingItemType.FOLLOW_UP,
    priority: PendingItemPriority.MEDIUM,
    status: PendingItemStatus.PENDING,
    referenceType: null,
    trackingCode: null,
    assignedToEmail: 'pablo.sanchez@techservice.local',
    createdByEmail: 'admin@techservice.local',
    completedAt: null,
  },
  {
    title: 'Configurar fuente ATX de repuesto',
    description:
      'La fuente ATX 650W llegó al taller. Verificar compatibilidad y preparar instalación para la PC de Camila Sosa.',
    dueDate: '2026-06-14',
    type: PendingItemType.WORK_ORDER,
    priority: PendingItemPriority.HIGH,
    status: PendingItemStatus.COMPLETED,
    referenceType: 'work_order',
    trackingCode: 'TS-PC0008',
    assignedToEmail: 'laura.fernandez@techservice.local',
    createdByEmail: 'admin@techservice.local',
    completedAt: '2026-06-14T15:30:00.000Z',
  },
  {
    title: 'Renovar seguro del local',
    description:
      'El seguro del local vence el 30/06. Solicitar renovación con cobertura actualizada incluyendo equipos de reparación.',
    dueDate: '2026-06-28',
    type: PendingItemType.OTHER,
    priority: PendingItemPriority.LOW,
    status: PendingItemStatus.PENDING,
    referenceType: null,
    trackingCode: null,
    assignedToEmail: null,
    createdByEmail: 'admin@techservice.local',
    completedAt: null,
  },
  {
    title: 'Revisión periódica de red WiFi del taller',
    description:
      'Verificar funcionamiento del AP Ubiquiti, actualizar firmware si hay nueva versión, revisar logs de conectividad.',
    dueDate: '2026-06-25',
    type: PendingItemType.MAINTENANCE,
    priority: PendingItemPriority.LOW,
    status: PendingItemStatus.CANCELLED,
    referenceType: null,
    trackingCode: null,
    assignedToEmail: 'diego.martinez@techservice.local',
    createdByEmail: 'admin@techservice.local',
    completedAt: null,
  },
  {
    title: 'Urgente: Reparar cortocircuito en mostrador',
    description:
      'Cortocircuito detectado en sector mostrador. Riesgo para clientes y personal. Reparación urgente antes de apertura.',
    dueDate: '2026-06-15',
    type: PendingItemType.WORK_ORDER,
    priority: PendingItemPriority.URGENT,
    status: PendingItemStatus.IN_PROGRESS,
    referenceType: 'work_order',
    trackingCode: 'TS-EL0005',
    assignedToEmail: 'pablo.sanchez@techservice.local',
    createdByEmail: 'admin@techservice.local',
    completedAt: null,
  },
  {
    title: 'Entregar notebook reparada a cliente',
    description:
      'Notebook de Santiago Álvarez reparada. Coordinar entrega y obtener conformidad del cliente.',
    dueDate: '2026-06-20',
    type: PendingItemType.FOLLOW_UP,
    priority: PendingItemPriority.MEDIUM,
    status: PendingItemStatus.PENDING,
    referenceType: 'work_order',
    trackingCode: 'TS-NB0009',
    assignedToEmail: 'maria.lopez@techservice.local',
    createdByEmail: 'admin@techservice.local',
    completedAt: null,
  },
];

export async function seedPendingItems(dataSource: DataSource) {
  const pendingItemRepo = dataSource.getRepository(PendingItem);
  const userRepo = dataSource.getRepository(User);
  const workOrderRepo = dataSource.getRepository(WorkOrder);

  const admin = await userRepo.findOne({
    where: { email: 'admin@techservice.local' },
  });

  if (!admin) {
    console.log('  Admin user not found, skipping pending items seed');
    return;
  }

  for (const item of PENDING_ITEMS) {
    const existing = await pendingItemRepo.findOne({
      where: { title: item.title },
    });

    if (existing) {
      console.log('  Pending item already exists:', item.title);
      continue;
    }

    let assignedToId: string | null = null;
    if (item.assignedToEmail) {
      const assignedUser = await userRepo.findOne({
        where: { email: item.assignedToEmail },
      });
      if (assignedUser) {
        assignedToId = assignedUser.id;
      }
    }

    let referenceId: string | null = null;
    if (item.trackingCode) {
      const workOrder = await workOrderRepo.findOne({
        where: { trackingCode: item.trackingCode },
      });
      if (workOrder) {
        referenceId = workOrder.id;
      }
    }

    const pendingItem = pendingItemRepo.create({
      title: item.title,
      description: item.description,
      dueDate: new Date(item.dueDate),
      type: item.type,
      priority: item.priority,
      status: item.status,
      referenceType: item.referenceType ?? undefined,
      referenceId: referenceId ?? undefined,
      assignedToId: assignedToId ?? undefined,
      createdById: admin.id,
      completedAt: item.completedAt ? new Date(item.completedAt) : undefined,
    });

    await pendingItemRepo.save(pendingItem);
    console.log('  Pending item created:', item.title, '-', item.status);
  }
}
