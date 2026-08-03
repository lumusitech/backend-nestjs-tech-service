import { DataSource } from 'typeorm';
import { WorkOrder } from '../../work-orders/entities/work-order.entity';
import { WorkOrderStatusLog } from '../../work-orders/entities/work-order-status-log.entity';
import { WorkOrderStatus } from '../../common/enums/work-order-status.enum';
import { Priority } from '../../common/enums/priority.enum';
import { WorkOrderLocation } from '../../work-orders/enums/work-order-location.enum';
import { Client } from '../../clients/entities/client.entity';
import { ServiceType } from '../../service-types/entities/service-type.entity';
import { User } from '../../users/entities/user.entity';
import { UserRole } from '../../users/enums/user-role.enum';

const STATUS_FLOW: Record<WorkOrderStatus, WorkOrderStatus[]> = {
  [WorkOrderStatus.PENDING]: [],
  [WorkOrderStatus.ASSIGNED]: [WorkOrderStatus.PENDING],
  [WorkOrderStatus.ON_THE_WAY]: [
    WorkOrderStatus.PENDING,
    WorkOrderStatus.ASSIGNED,
  ],
  [WorkOrderStatus.IN_PROGRESS]: [
    WorkOrderStatus.PENDING,
    WorkOrderStatus.ASSIGNED,
  ],
  [WorkOrderStatus.POSTPONED]: [
    WorkOrderStatus.PENDING,
    WorkOrderStatus.ASSIGNED,
    WorkOrderStatus.IN_PROGRESS,
  ],
  [WorkOrderStatus.COMPLETED]: [
    WorkOrderStatus.PENDING,
    WorkOrderStatus.ASSIGNED,
    WorkOrderStatus.IN_PROGRESS,
  ],
  [WorkOrderStatus.DELIVERED]: [
    WorkOrderStatus.PENDING,
    WorkOrderStatus.ASSIGNED,
    WorkOrderStatus.IN_PROGRESS,
    WorkOrderStatus.COMPLETED,
  ],
  [WorkOrderStatus.CANCELLED]: [
    WorkOrderStatus.PENDING,
    WorkOrderStatus.ASSIGNED,
    WorkOrderStatus.IN_PROGRESS,
  ],
};

function buildTimestamps(
  currentStatus: WorkOrderStatus,
  scheduledDate: Date | undefined,
  startedAt: Date | undefined,
  completedAt: Date | undefined,
): Date[] {
  const now = new Date();
  const dayMs = 86400000;
  const hourMs = 3600000;
  const base = scheduledDate
    ? new Date(scheduledDate)
    : new Date(now.getTime() - dayMs);

  const flow = STATUS_FLOW[currentStatus];
  const steps = [...flow, currentStatus];
  const timestamps: Date[] = [];

  for (let i = 0; i < steps.length; i++) {
    const status = steps[i];
    if (status === WorkOrderStatus.IN_PROGRESS && startedAt) {
      timestamps.push(new Date(startedAt));
    } else if (status === WorkOrderStatus.COMPLETED && completedAt) {
      timestamps.push(new Date(completedAt));
    } else if (
      status === WorkOrderStatus.ASSIGNED &&
      currentStatus !== WorkOrderStatus.PENDING
    ) {
      timestamps.push(new Date(base.getTime() + dayMs * i * 0.3));
    } else if (status === WorkOrderStatus.DELIVERED && completedAt) {
      timestamps.push(new Date(completedAt.getTime() + hourMs * 2));
    } else {
      timestamps.push(new Date(base.getTime() + dayMs * i * 0.3));
    }
  }

  return timestamps;
}

interface WorkOrderSeed {
  trackingCode: string;
  status: WorkOrderStatus;
  priority: Priority;
  location: WorkOrderLocation;
  diagnosis: string | undefined;
  commissionPercent: number | undefined;
  sellerEmail: string | undefined;
  warrantyUntil: string | undefined;
  scheduledDate: string | undefined;
  startedAt: string | undefined;
  completedAt: string | undefined;
  clientEmail: string;
  serviceTypeName: string;
  technicianEmails: string[];
  statusLogDetails?: Partial<Record<WorkOrderStatus, string>>;
}

const WORK_ORDERS: WorkOrderSeed[] = [
  {
    trackingCode: 'TS-PC0001',
    status: WorkOrderStatus.DELIVERED,
    priority: Priority.MEDIUM,
    location: WorkOrderLocation.WORKSHOP,
    diagnosis:
      'Disco duro dañado, se reemplazó por SSD de 480GB. Se reinstaló Windows 11 y drivers.',
    commissionPercent: 5,
    sellerEmail: 'sofia.ramirez@techservice.local',
    warrantyUntil: '2026-12-15',
    scheduledDate: '2026-05-10',
    startedAt: '2026-05-10T09:00:00.000Z',
    completedAt: '2026-05-12T16:30:00.000Z',
    clientEmail: 'juan.perez@gmail.com',
    serviceTypeName: 'Reparación de PC',
    technicianEmails: ['carlos.garcia@techservice.local'],
    statusLogDetails: {
      [WorkOrderStatus.ASSIGNED]: 'Orden asignada a Carlos García',
      [WorkOrderStatus.IN_PROGRESS]: 'Reparación iniciada en taller',
      [WorkOrderStatus.COMPLETED]:
        'Reemplazo de disco completado y control de calidad OK',
      [WorkOrderStatus.DELIVERED]:
        'Equipo entregado al cliente con garantía de 6 meses',
    },
  },
  {
    trackingCode: 'TS-NB0002',
    status: WorkOrderStatus.IN_PROGRESS,
    priority: Priority.HIGH,
    location: WorkOrderLocation.WORKSHOP,
    diagnosis:
      'Pantalla con líneas verticales, posible problema de flex o display. Pendiente repuesto.',
    commissionPercent: 7,
    sellerEmail: 'martin.torres@techservice.local',
    warrantyUntil: undefined,
    scheduledDate: '2026-06-01',
    startedAt: '2026-06-02T10:00:00.000Z',
    completedAt: undefined,
    clientEmail: 'ana.rodriguez@hotmail.com',
    serviceTypeName: 'Reparación de Notebook',
    technicianEmails: ['maria.lopez@techservice.local'],
    statusLogDetails: {
      [WorkOrderStatus.ASSIGNED]: 'Orden asignada a María López',
      [WorkOrderStatus.IN_PROGRESS]:
        'Diagnóstico iniciado; se detectó falla de display',
    },
  },
  {
    trackingCode: 'TS-CAM003',
    status: WorkOrderStatus.ASSIGNED,
    priority: Priority.MEDIUM,
    location: WorkOrderLocation.ON_SITE,
    diagnosis: undefined,
    commissionPercent: 5,
    sellerEmail: 'sofia.ramirez@techservice.local',
    warrantyUntil: undefined,
    scheduledDate: '2026-06-10',
    startedAt: undefined,
    completedAt: undefined,
    clientEmail: 'roberto.gonzalez@gmail.com',
    serviceTypeName: 'Instalación de cámaras de seguridad',
    technicianEmails: [
      'diego.martinez@techservice.local',
      'pablo.sanchez@techservice.local',
    ],
    statusLogDetails: {
      [WorkOrderStatus.ASSIGNED]:
        'Orden asignada a Diego Martínez y Pablo Sánchez',
    },
  },
  {
    trackingCode: 'TS-TV0004',
    status: WorkOrderStatus.DELIVERED,
    priority: Priority.LOW,
    location: WorkOrderLocation.WORKSHOP,
    diagnosis:
      'Fuente de alimentación quemada. Se reemplazó fuente y se verificó funcionamiento completo.',
    commissionPercent: 5,
    sellerEmail: 'sofia.ramirez@techservice.local',
    warrantyUntil: '2026-09-20',
    scheduledDate: '2026-05-15',
    startedAt: '2026-05-15T14:00:00.000Z',
    completedAt: '2026-05-18T11:00:00.000Z',
    clientEmail: 'luciana.martinez@yahoo.com',
    serviceTypeName: 'Reparación de TV',
    technicianEmails: ['carlos.garcia@techservice.local'],
    statusLogDetails: {
      [WorkOrderStatus.ASSIGNED]: 'Orden asignada a Carlos García',
      [WorkOrderStatus.IN_PROGRESS]: 'Reparación iniciada en taller',
      [WorkOrderStatus.COMPLETED]: 'Fuente reemplazada y TV verificado',
      [WorkOrderStatus.DELIVERED]: 'TV entregado al cliente',
    },
  },
  {
    trackingCode: 'TS-EL0005',
    status: WorkOrderStatus.IN_PROGRESS,
    priority: Priority.URGENT,
    location: WorkOrderLocation.ON_SITE,
    diagnosis:
      'Cortocircuito en línea eléctrica del local. Se identificó cableado defectuoso en sector mostrador.',
    commissionPercent: undefined,
    sellerEmail: undefined,
    warrantyUntil: undefined,
    scheduledDate: '2026-06-04',
    startedAt: '2026-06-04T08:00:00.000Z',
    completedAt: undefined,
    clientEmail: 'fernando.diaz@gmail.com',
    serviceTypeName: 'Servicio eléctrico',
    technicianEmails: ['pablo.sanchez@techservice.local'],
    statusLogDetails: {
      [WorkOrderStatus.ASSIGNED]: 'Orden asignada a Pablo Sánchez',
      [WorkOrderStatus.IN_PROGRESS]:
        'Trabajo iniciado en el local; se identificó cableado defectuoso',
    },
  },
  {
    trackingCode: 'TS-WF0006',
    status: WorkOrderStatus.COMPLETED,
    priority: Priority.MEDIUM,
    location: WorkOrderLocation.ON_SITE,
    diagnosis:
      'Se instaló Access Point Ubiquiti, se configuró red WiFi con VLAN para invitados. Cobertura optimizada.',
    commissionPercent: 7,
    sellerEmail: 'martin.torres@techservice.local',
    warrantyUntil: '2026-12-01',
    scheduledDate: '2026-05-20',
    startedAt: '2026-05-20T09:30:00.000Z',
    completedAt: '2026-05-20T17:00:00.000Z',
    clientEmail: 'valentina.torres@hotmail.com',
    serviceTypeName: 'Instalación de red/WiFi',
    technicianEmails: ['diego.martinez@techservice.local'],
    statusLogDetails: {
      [WorkOrderStatus.ASSIGNED]: 'Orden asignada a Diego Martínez',
      [WorkOrderStatus.IN_PROGRESS]:
        'Trabajo iniciado; instalación de Access Point',
      [WorkOrderStatus.COMPLETED]: 'Red configurada y cobertura verificada',
    },
  },
  {
    trackingCode: 'TS-MT0007',
    status: WorkOrderStatus.CANCELLED,
    priority: Priority.LOW,
    location: WorkOrderLocation.WORKSHOP,
    diagnosis: undefined,
    commissionPercent: undefined,
    sellerEmail: undefined,
    warrantyUntil: undefined,
    scheduledDate: '2026-05-25',
    startedAt: undefined,
    completedAt: undefined,
    clientEmail: 'martin.romero@gmail.com',
    serviceTypeName: 'Mantenimiento general',
    technicianEmails: [],
    statusLogDetails: {
      [WorkOrderStatus.ASSIGNED]: 'Orden asignada sin técnico confirmado',
      [WorkOrderStatus.CANCELLED]:
        'El cliente se tuvo que ir temprano, coordinar día para terminar.',
    },
  },
  {
    trackingCode: 'TS-PC0008',
    status: WorkOrderStatus.POSTPONED,
    priority: Priority.MEDIUM,
    location: WorkOrderLocation.WORKSHOP,
    diagnosis:
      'Esperando repuesto (fuente ATX 650W). Reprogramado para la próxima semana.',
    commissionPercent: 5,
    sellerEmail: 'sofia.ramirez@techservice.local',
    warrantyUntil: undefined,
    scheduledDate: '2026-06-03',
    startedAt: '2026-06-03T10:00:00.000Z',
    completedAt: undefined,
    clientEmail: 'camila.sosa@yahoo.com',
    serviceTypeName: 'Reparación de PC',
    technicianEmails: ['laura.fernandez@techservice.local'],
    statusLogDetails: {
      [WorkOrderStatus.ASSIGNED]: 'Orden asignada a Laura Fernández',
      [WorkOrderStatus.IN_PROGRESS]: 'Diagnóstico de fuente ATX iniciado',
      [WorkOrderStatus.POSTPONED]:
        'Esperando repuesto (fuente ATX 650W), reprogramado para la próxima semana.',
    },
  },
  {
    trackingCode: 'TS-NB0009',
    status: WorkOrderStatus.PENDING,
    priority: Priority.MEDIUM,
    location: WorkOrderLocation.WORKSHOP,
    diagnosis: undefined,
    commissionPercent: 7,
    sellerEmail: 'martin.torres@techservice.local',
    warrantyUntil: undefined,
    scheduledDate: undefined,
    startedAt: undefined,
    completedAt: undefined,
    clientEmail: 'santiago.alvarez@gmail.com',
    serviceTypeName: 'Reparación de Notebook',
    technicianEmails: [],
    statusLogDetails: {
      [WorkOrderStatus.PENDING]: 'Orden creada; pendiente de asignación',
    },
  },
  {
    trackingCode: 'TS-WF0010',
    status: WorkOrderStatus.DELIVERED,
    priority: Priority.HIGH,
    location: WorkOrderLocation.ON_SITE,
    diagnosis:
      'Se reemplazó router averiado, se configuró red mesh con 3 nodos. WiFi 6 en toda la oficina.',
    commissionPercent: 5,
    sellerEmail: 'sofia.ramirez@techservice.local',
    warrantyUntil: '2027-06-01',
    scheduledDate: '2026-05-28',
    startedAt: '2026-05-28T08:30:00.000Z',
    completedAt: '2026-05-28T18:00:00.000Z',
    clientEmail: 'isabella.lopez@hotmail.com',
    serviceTypeName: 'Instalación de red/WiFi',
    technicianEmails: [
      'diego.martinez@techservice.local',
      'carlos.garcia@techservice.local',
    ],
    statusLogDetails: {
      [WorkOrderStatus.ASSIGNED]:
        'Orden asignada a Diego Martínez y Carlos García',
      [WorkOrderStatus.IN_PROGRESS]:
        'Trabajo iniciado; instalación de nodos mesh',
      [WorkOrderStatus.COMPLETED]: 'Red mesh configurada y WiFi 6 optimizado',
      [WorkOrderStatus.DELIVERED]:
        'Instalación entregada y verificada con el cliente',
    },
  },
  {
    trackingCode: 'TS-TV0011',
    status: WorkOrderStatus.IN_PROGRESS,
    priority: Priority.MEDIUM,
    location: WorkOrderLocation.WORKSHOP,
    diagnosis:
      'Panel LED con zonas oscuras. Se ordenó panel de reemplazo compatible.',
    commissionPercent: undefined,
    sellerEmail: undefined,
    warrantyUntil: undefined,
    scheduledDate: '2026-06-02',
    startedAt: '2026-06-03T11:00:00.000Z',
    completedAt: undefined,
    clientEmail: 'mateo.ruiz@gmail.com',
    serviceTypeName: 'Reparación de TV',
    technicianEmails: ['laura.fernandez@techservice.local'],
    statusLogDetails: {
      [WorkOrderStatus.ASSIGNED]: 'Orden asignada a Laura Fernández',
      [WorkOrderStatus.IN_PROGRESS]:
        'Diagnóstico iniciado; panel LED con zonas oscuras',
    },
  },
  {
    trackingCode: 'TS-EL0012',
    status: WorkOrderStatus.COMPLETED,
    priority: Priority.HIGH,
    location: WorkOrderLocation.ON_SITE,
    diagnosis:
      'Se instalaron 4 tomas nuevas en oficina, se agregó disyuntor diferencial y termica dedicada.',
    commissionPercent: 7,
    sellerEmail: 'martin.torres@techservice.local',
    warrantyUntil: '2026-12-10',
    scheduledDate: '2026-05-22',
    startedAt: '2026-05-22T08:00:00.000Z',
    completedAt: '2026-05-22T16:00:00.000Z',
    clientEmail: 'sofia.castro@yahoo.com',
    serviceTypeName: 'Servicio eléctrico',
    technicianEmails: ['pablo.sanchez@techservice.local'],
    statusLogDetails: {
      [WorkOrderStatus.ASSIGNED]: 'Orden asignada a Pablo Sánchez',
      [WorkOrderStatus.IN_PROGRESS]: 'Trabajo iniciado; tendido de cables',
      [WorkOrderStatus.COMPLETED]:
        'Tomas y protecciones instaladas y verificadas',
    },
  },
  {
    trackingCode: 'TS-CAM013',
    status: WorkOrderStatus.DELIVERED,
    priority: Priority.HIGH,
    location: WorkOrderLocation.ON_SITE,
    diagnosis:
      'Se instalaron 8 cámaras Hikvision 4MP con DVR de 8 canales. Monitoreo remoto configurado via app.',
    commissionPercent: 5,
    sellerEmail: 'sofia.ramirez@techservice.local',
    warrantyUntil: '2027-06-05',
    scheduledDate: '2026-05-12',
    startedAt: '2026-05-12T08:00:00.000Z',
    completedAt: '2026-05-14T17:00:00.000Z',
    clientEmail: 'benjamin.moreno@gmail.com',
    serviceTypeName: 'Instalación de cámaras de seguridad',
    technicianEmails: [
      'diego.martinez@techservice.local',
      'pablo.sanchez@techservice.local',
    ],
    statusLogDetails: {
      [WorkOrderStatus.ASSIGNED]:
        'Orden asignada a Diego Martínez y Pablo Sánchez',
      [WorkOrderStatus.IN_PROGRESS]:
        'Instalación iniciada; cableado de 8 puntos',
      [WorkOrderStatus.COMPLETED]: 'Cámaras montadas y DVR configurado',
      [WorkOrderStatus.DELIVERED]:
        'Sistema entregado con monitoreo remoto activo',
    },
  },
  {
    trackingCode: 'TS-PC0014',
    status: WorkOrderStatus.PENDING,
    priority: Priority.LOW,
    location: WorkOrderLocation.WORKSHOP,
    diagnosis: undefined,
    commissionPercent: undefined,
    sellerEmail: undefined,
    warrantyUntil: undefined,
    scheduledDate: undefined,
    startedAt: undefined,
    completedAt: undefined,
    clientEmail: 'emma.herrera@hotmail.com',
    serviceTypeName: 'Mantenimiento general',
    technicianEmails: [],
    statusLogDetails: {
      [WorkOrderStatus.PENDING]: 'Orden creada; pendiente de asignación',
    },
  },
  {
    trackingCode: 'TS-MT0015',
    status: WorkOrderStatus.ASSIGNED,
    priority: Priority.MEDIUM,
    location: WorkOrderLocation.ON_SITE,
    diagnosis: undefined,
    commissionPercent: 5,
    sellerEmail: 'sofia.ramirez@techservice.local',
    warrantyUntil: undefined,
    scheduledDate: '2026-06-08',
    startedAt: undefined,
    completedAt: undefined,
    clientEmail: 'tomas.vargas@gmail.com',
    serviceTypeName: 'Mantenimiento general',
    technicianEmails: ['maria.lopez@techservice.local'],
    statusLogDetails: {
      [WorkOrderStatus.ASSIGNED]: 'Orden asignada a María López',
    },
  },
  {
    trackingCode: 'TS-CAM0016',
    status: WorkOrderStatus.ON_THE_WAY,
    priority: Priority.HIGH,
    location: WorkOrderLocation.ON_SITE,
    diagnosis:
      'Instalación de 4 cámaras exteriores con visión nocturna. Cliente solicitó refuerzo de seguridad en el comercio.',
    commissionPercent: 5,
    sellerEmail: 'sofia.ramirez@techservice.local',
    warrantyUntil: undefined,
    scheduledDate: '2026-08-03',
    startedAt: undefined,
    completedAt: undefined,
    clientEmail: 'joaquin.pereyra@yahoo.com',
    serviceTypeName: 'Instalación de cámaras de seguridad',
    technicianEmails: [
      'diego.martinez@techservice.local',
      'pablo.sanchez@techservice.local',
    ],
    statusLogDetails: {
      [WorkOrderStatus.ASSIGNED]:
        'Orden asignada a Diego Martínez y Pablo Sánchez',
      [WorkOrderStatus.ON_THE_WAY]:
        'Equipo técnico en camino al domicilio del cliente',
    },
  },
];

export async function seedWorkOrders(dataSource: DataSource) {
  const workOrderRepo = dataSource.getRepository(WorkOrder);
  const logRepo = dataSource.getRepository(WorkOrderStatusLog);
  const clientRepo = dataSource.getRepository(Client);
  const serviceTypeRepo = dataSource.getRepository(ServiceType);
  const userRepo = dataSource.getRepository(User);

  const adminUser = await userRepo.findOne({
    where: { role: UserRole.ADMIN },
  });
  if (!adminUser) {
    console.log(
      '  No admin user found, status logs will skip changedByUserId validation',
    );
  }

  for (const wo of WORK_ORDERS) {
    const existing = await workOrderRepo.findOne({
      where: { trackingCode: wo.trackingCode },
    });

    if (existing) {
      console.log('  Work order already exists:', wo.trackingCode);
      continue;
    }

    const client = await clientRepo.findOne({
      where: { email: wo.clientEmail },
    });
    if (!client) {
      console.log(
        '  Client not found for work order:',
        wo.trackingCode,
        wo.clientEmail,
      );
      continue;
    }

    const serviceType = await serviceTypeRepo.findOne({
      where: { name: wo.serviceTypeName },
    });
    if (!serviceType) {
      console.log(
        '  Service type not found for work order:',
        wo.trackingCode,
        wo.serviceTypeName,
      );
      continue;
    }

    const technicians: User[] = [];
    for (const techEmail of wo.technicianEmails) {
      const tech = await userRepo.findOne({ where: { email: techEmail } });
      if (tech) {
        technicians.push(tech);
      }
    }

    let sellerId: string | undefined = undefined;
    if (wo.sellerEmail) {
      const seller = await userRepo.findOne({
        where: { email: wo.sellerEmail },
      });
      if (seller) {
        sellerId = seller.id;
      }
    }

    const workOrder = workOrderRepo.create({
      trackingCode: wo.trackingCode,
      status: wo.status,
      priority: wo.priority,
      location: wo.location,
      diagnosis: wo.diagnosis,
      commissionPercent: wo.commissionPercent,
      sellerId,
      warrantyUntil: wo.warrantyUntil ? new Date(wo.warrantyUntil) : undefined,
      scheduledDate: wo.scheduledDate ? new Date(wo.scheduledDate) : undefined,
      startedAt: wo.startedAt ? new Date(wo.startedAt) : undefined,
      completedAt: wo.completedAt ? new Date(wo.completedAt) : undefined,
      clientId: client.id,
      serviceTypeId: serviceType.id,
      technicians,
    });

    const saved = await workOrderRepo.save(workOrder);

    // Create status timeline logs for the work order
    const flow = STATUS_FLOW[wo.status];
    const steps = [...flow, wo.status];
    const timestamps = buildTimestamps(
      wo.status,
      wo.scheduledDate ? new Date(wo.scheduledDate) : undefined,
      wo.startedAt ? new Date(wo.startedAt) : undefined,
      wo.completedAt ? new Date(wo.completedAt) : undefined,
    );

    const logs: WorkOrderStatusLog[] = [];
    for (let i = 0; i < steps.length; i++) {
      const fromStatus: WorkOrderStatus | null = i === 0 ? null : steps[i - 1];
      const toStatus = steps[i];
      const timestamp = timestamps[i] || new Date();

      const previousLog = i > 0 ? logs[i - 1] : null;
      const duration = previousLog
        ? Math.floor(
            (timestamp.getTime() - new Date(previousLog.timestamp).getTime()) /
              1000,
          )
        : null;

      const changedByUserId =
        saved.sellerId ||
        saved.technicians?.[0]?.id ||
        adminUser?.id ||
        '00000000-0000-0000-0000-000000000000';

      const changedByRole = saved.technicians?.some(
        (t) => t.id === changedByUserId,
      )
        ? 'technician'
        : changedByUserId === saved.sellerId
          ? 'seller'
          : 'admin';

      const log = logRepo.create({
        workOrderId: saved.id,
        fromStatus,
        toStatus,
        changedByUserId,
        changedByRole,
        timestamp,
        duration,
        detail: wo.statusLogDetails?.[toStatus] ?? null,
      });
      logs.push(log);
    }

    if (logs.length > 0) {
      await logRepo.save(logs);
    }

    console.log(
      '  Work order created:',
      wo.trackingCode,
      '-',
      wo.status,
      `(${logs.length} status logs)`,
    );
  }
}
