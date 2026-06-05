import { DataSource } from 'typeorm';
import { WorkOrder } from '../../work-orders/entities/work-order.entity';
import { WorkOrderStatus } from '../../common/enums/work-order-status.enum';
import { Priority } from '../../common/enums/priority.enum';
import { WorkOrderLocation } from '../../work-orders/enums/work-order-location.enum';
import { Client } from '../../clients/entities/client.entity';
import { ServiceType } from '../../service-types/entities/service-type.entity';
import { User } from '../../users/entities/user.entity';

interface WorkOrderSeed {
  trackingCode: string;
  status: WorkOrderStatus;
  priority: Priority;
  location: WorkOrderLocation;
  diagnosis: string | undefined;
  warrantyUntil: string | undefined;
  scheduledDate: string | undefined;
  startedAt: string | undefined;
  completedAt: string | undefined;
  clientEmail: string;
  serviceTypeName: string;
  technicianEmails: string[];
}

const WORK_ORDERS: WorkOrderSeed[] = [
  {
    trackingCode: 'TS-PC0001',
    status: WorkOrderStatus.DELIVERED,
    priority: Priority.MEDIUM,
    location: WorkOrderLocation.WORKSHOP,
    diagnosis: 'Disco duro dañado, se reemplazó por SSD de 480GB. Se reinstaló Windows 11 y drivers.',
    warrantyUntil: '2026-12-15',
    scheduledDate: '2026-05-10',
    startedAt: '2026-05-10T09:00:00.000Z',
    completedAt: '2026-05-12T16:30:00.000Z',
    clientEmail: 'juan.perez@gmail.com',
    serviceTypeName: 'Reparación de PC',
    technicianEmails: ['carlos.garcia@techservice.local'],
  },
  {
    trackingCode: 'TS-NB0002',
    status: WorkOrderStatus.IN_PROGRESS,
    priority: Priority.HIGH,
    location: WorkOrderLocation.WORKSHOP,
    diagnosis: 'Pantalla con líneas verticales, posible problema de flex o display. Pendiente repuesto.',
    warrantyUntil: undefined,
    scheduledDate: '2026-06-01',
    startedAt: '2026-06-02T10:00:00.000Z',
    completedAt: undefined,
    clientEmail: 'ana.rodriguez@hotmail.com',
    serviceTypeName: 'Reparación de Notebook',
    technicianEmails: ['maria.lopez@techservice.local'],
  },
  {
    trackingCode: 'TS-CAM003',
    status: WorkOrderStatus.ASSIGNED,
    priority: Priority.MEDIUM,
    location: WorkOrderLocation.ON_SITE,
    diagnosis: undefined,
    warrantyUntil: undefined,
    scheduledDate: '2026-06-10',
    startedAt: undefined,
    completedAt: undefined,
    clientEmail: 'roberto.gonzalez@gmail.com',
    serviceTypeName: 'Instalación de cámaras de seguridad',
    technicianEmails: ['diego.martinez@techservice.local', 'pablo.sanchez@techservice.local'],
  },
  {
    trackingCode: 'TS-TV0004',
    status: WorkOrderStatus.DELIVERED,
    priority: Priority.LOW,
    location: WorkOrderLocation.WORKSHOP,
    diagnosis: 'Fuente de alimentación quemada. Se reemplazó fuente y se verificó funcionamiento completo.',
    warrantyUntil: '2026-09-20',
    scheduledDate: '2026-05-15',
    startedAt: '2026-05-15T14:00:00.000Z',
    completedAt: '2026-05-18T11:00:00.000Z',
    clientEmail: 'luciana.martinez@yahoo.com',
    serviceTypeName: 'Reparación de TV',
    technicianEmails: ['carlos.garcia@techservice.local'],
  },
  {
    trackingCode: 'TS-EL0005',
    status: WorkOrderStatus.IN_PROGRESS,
    priority: Priority.URGENT,
    location: WorkOrderLocation.ON_SITE,
    diagnosis: 'Cortocircuito en línea eléctrica del local. Se identificó cableado defectuoso en sector mostrador.',
    warrantyUntil: undefined,
    scheduledDate: '2026-06-04',
    startedAt: '2026-06-04T08:00:00.000Z',
    completedAt: undefined,
    clientEmail: 'fernando.diaz@gmail.com',
    serviceTypeName: 'Servicio eléctrico',
    technicianEmails: ['pablo.sanchez@techservice.local'],
  },
  {
    trackingCode: 'TS-WF0006',
    status: WorkOrderStatus.COMPLETED,
    priority: Priority.MEDIUM,
    location: WorkOrderLocation.ON_SITE,
    diagnosis: 'Se instaló Access Point Ubiquiti, se configuró red WiFi con VLAN para invitados. Cobertura optimizada.',
    warrantyUntil: '2026-12-01',
    scheduledDate: '2026-05-20',
    startedAt: '2026-05-20T09:30:00.000Z',
    completedAt: '2026-05-20T17:00:00.000Z',
    clientEmail: 'valentina.torres@hotmail.com',
    serviceTypeName: 'Instalación de red/WiFi',
    technicianEmails: ['diego.martinez@techservice.local'],
  },
  {
    trackingCode: 'TS-MT0007',
    status: WorkOrderStatus.CANCELLED,
    priority: Priority.LOW,
    location: WorkOrderLocation.WORKSHOP,
    diagnosis: undefined,
    warrantyUntil: undefined,
    scheduledDate: '2026-05-25',
    startedAt: undefined,
    completedAt: undefined,
    clientEmail: 'martin.romero@gmail.com',
    serviceTypeName: 'Mantenimiento general',
    technicianEmails: [],
  },
  {
    trackingCode: 'TS-PC0008',
    status: WorkOrderStatus.POSTPONED,
    priority: Priority.MEDIUM,
    location: WorkOrderLocation.WORKSHOP,
    diagnosis: 'Esperando repuesto (fuente ATX 650W). Reprogramado para la próxima semana.',
    warrantyUntil: undefined,
    scheduledDate: '2026-06-03',
    startedAt: '2026-06-03T10:00:00.000Z',
    completedAt: undefined,
    clientEmail: 'camila.sosa@yahoo.com',
    serviceTypeName: 'Reparación de PC',
    technicianEmails: ['laura.fernandez@techservice.local'],
  },
  {
    trackingCode: 'TS-NB0009',
    status: WorkOrderStatus.PENDING,
    priority: Priority.MEDIUM,
    location: WorkOrderLocation.WORKSHOP,
    diagnosis: undefined,
    warrantyUntil: undefined,
    scheduledDate: undefined,
    startedAt: undefined,
    completedAt: undefined,
    clientEmail: 'santiago.alvarez@gmail.com',
    serviceTypeName: 'Reparación de Notebook',
    technicianEmails: [],
  },
  {
    trackingCode: 'TS-WF0010',
    status: WorkOrderStatus.DELIVERED,
    priority: Priority.HIGH,
    location: WorkOrderLocation.ON_SITE,
    diagnosis: 'Se reemplazó router averiado, se configuró red mesh con 3 nodos. WiFi 6 en toda la oficina.',
    warrantyUntil: '2027-06-01',
    scheduledDate: '2026-05-28',
    startedAt: '2026-05-28T08:30:00.000Z',
    completedAt: '2026-05-28T18:00:00.000Z',
    clientEmail: 'isabella.lopez@hotmail.com',
    serviceTypeName: 'Instalación de red/WiFi',
    technicianEmails: ['diego.martinez@techservice.local', 'carlos.garcia@techservice.local'],
  },
  {
    trackingCode: 'TS-TV0011',
    status: WorkOrderStatus.IN_PROGRESS,
    priority: Priority.MEDIUM,
    location: WorkOrderLocation.WORKSHOP,
    diagnosis: 'Panel LED con zonas oscuras. Se ordenó panel de reemplazo compatible.',
    warrantyUntil: undefined,
    scheduledDate: '2026-06-02',
    startedAt: '2026-06-03T11:00:00.000Z',
    completedAt: undefined,
    clientEmail: 'mateo.ruiz@gmail.com',
    serviceTypeName: 'Reparación de TV',
    technicianEmails: ['laura.fernandez@techservice.local'],
  },
  {
    trackingCode: 'TS-EL0012',
    status: WorkOrderStatus.COMPLETED,
    priority: Priority.HIGH,
    location: WorkOrderLocation.ON_SITE,
    diagnosis: 'Se instalaron 4 tomas nuevas en oficina, se agregó disyuntor diferencial y termica dedicada.',
    warrantyUntil: '2026-12-10',
    scheduledDate: '2026-05-22',
    startedAt: '2026-05-22T08:00:00.000Z',
    completedAt: '2026-05-22T16:00:00.000Z',
    clientEmail: 'sofia.castro@yahoo.com',
    serviceTypeName: 'Servicio eléctrico',
    technicianEmails: ['pablo.sanchez@techservice.local'],
  },
  {
    trackingCode: 'TS-CAM013',
    status: WorkOrderStatus.DELIVERED,
    priority: Priority.HIGH,
    location: WorkOrderLocation.ON_SITE,
    diagnosis: 'Se instalaron 8 cámaras Hikvision 4MP con DVR de 8 canales. Monitoreo remoto configurado via app.',
    warrantyUntil: '2027-06-05',
    scheduledDate: '2026-05-12',
    startedAt: '2026-05-12T08:00:00.000Z',
    completedAt: '2026-05-14T17:00:00.000Z',
    clientEmail: 'benjamin.moreno@gmail.com',
    serviceTypeName: 'Instalación de cámaras de seguridad',
    technicianEmails: ['diego.martinez@techservice.local', 'pablo.sanchez@techservice.local'],
  },
  {
    trackingCode: 'TS-PC0014',
    status: WorkOrderStatus.PENDING,
    priority: Priority.LOW,
    location: WorkOrderLocation.WORKSHOP,
    diagnosis: undefined,
    warrantyUntil: undefined,
    scheduledDate: undefined,
    startedAt: undefined,
    completedAt: undefined,
    clientEmail: 'emma.herrera@hotmail.com',
    serviceTypeName: 'Mantenimiento general',
    technicianEmails: [],
  },
  {
    trackingCode: 'TS-MT0015',
    status: WorkOrderStatus.ASSIGNED,
    priority: Priority.MEDIUM,
    location: WorkOrderLocation.ON_SITE,
    diagnosis: undefined,
    warrantyUntil: undefined,
    scheduledDate: '2026-06-08',
    startedAt: undefined,
    completedAt: undefined,
    clientEmail: 'tomas.vargas@gmail.com',
    serviceTypeName: 'Mantenimiento general',
    technicianEmails: ['maria.lopez@techservice.local'],
  },
];

export async function seedWorkOrders(dataSource: DataSource) {
  const workOrderRepo = dataSource.getRepository(WorkOrder);
  const clientRepo = dataSource.getRepository(Client);
  const serviceTypeRepo = dataSource.getRepository(ServiceType);
  const userRepo = dataSource.getRepository(User);

  for (const wo of WORK_ORDERS) {
    const existing = await workOrderRepo.findOne({
      where: { trackingCode: wo.trackingCode },
    });

    if (existing) {
      console.log('  Work order already exists:', wo.trackingCode);
      continue;
    }

    const client = await clientRepo.findOne({ where: { email: wo.clientEmail } });
    if (!client) {
      console.log('  Client not found for work order:', wo.trackingCode, wo.clientEmail);
      continue;
    }

    const serviceType = await serviceTypeRepo.findOne({ where: { name: wo.serviceTypeName } });
    if (!serviceType) {
      console.log('  Service type not found for work order:', wo.trackingCode, wo.serviceTypeName);
      continue;
    }

    const technicians: User[] = [];
    for (const techEmail of wo.technicianEmails) {
      const tech = await userRepo.findOne({ where: { email: techEmail } });
      if (tech) {
        technicians.push(tech);
      }
    }

    const workOrder = workOrderRepo.create({
      trackingCode: wo.trackingCode,
      status: wo.status,
      priority: wo.priority,
      location: wo.location,
      diagnosis: wo.diagnosis,
      warrantyUntil: wo.warrantyUntil ? new Date(wo.warrantyUntil) : undefined,
      scheduledDate: wo.scheduledDate ? new Date(wo.scheduledDate) : undefined,
      startedAt: wo.startedAt ? new Date(wo.startedAt) : undefined,
      completedAt: wo.completedAt ? new Date(wo.completedAt) : undefined,
      clientId: client.id,
      serviceTypeId: serviceType.id,
      technicians,
    });

    await workOrderRepo.save(workOrder);
    console.log('  Work order created:', wo.trackingCode, '-', wo.status);
  }
}
