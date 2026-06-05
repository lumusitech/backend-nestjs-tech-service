import { DataSource } from 'typeorm';
import { Task } from '../../work-orders/entities/task.entity';
import { WorkOrder } from '../../work-orders/entities/work-order.entity';
import { User } from '../../users/entities/user.entity';

interface TaskSeed {
  title: string;
  description: string;
  isCompleted: boolean;
  completedAt: string | undefined;
  trackingCode: string;
  assignedToEmail: string | undefined;
}

const TASKS: TaskSeed[] = [
  { title: 'Diagnóstico inicial del equipo', description: 'Revisar estado general y componentes', isCompleted: true, completedAt: '2026-05-10T10:30:00.000Z', trackingCode: 'TS-PC0001', assignedToEmail: 'carlos.garcia@techservice.local' },
  { title: 'Reemplazo de disco duro por SSD', description: 'Instalar SSD 480GB y migrar datos', isCompleted: true, completedAt: '2026-05-11T14:00:00.000Z', trackingCode: 'TS-PC0001', assignedToEmail: 'carlos.garcia@techservice.local' },
  { title: 'Instalación de Windows 11 y drivers', description: 'Instalar SO, drivers y actualizaciones', isCompleted: true, completedAt: '2026-05-12T15:00:00.000Z', trackingCode: 'TS-PC0001', assignedToEmail: 'carlos.garcia@techservice.local' },
  { title: 'Testing y control de calidad', description: 'Verificar funcionamiento completo del equipo', isCompleted: true, completedAt: '2026-05-12T16:00:00.000Z', trackingCode: 'TS-PC0001', assignedToEmail: 'carlos.garcia@techservice.local' },
  { title: 'Diagnóstico de pantalla', description: 'Verificar si es flex o display dañado', isCompleted: true, completedAt: '2026-06-02T11:30:00.000Z', trackingCode: 'TS-NB0002', assignedToEmail: 'maria.lopez@techservice.local' },
  { title: 'Pedido de repuesto de pantalla', description: 'Solicitar display compatible al proveedor', isCompleted: false, completedAt: undefined, trackingCode: 'TS-NB0002', assignedToEmail: 'maria.lopez@techservice.local' },
  { title: 'Reemplazo de pantalla', description: 'Instalar nuevo display y probar', isCompleted: false, completedAt: undefined, trackingCode: 'TS-NB0002', assignedToEmail: 'maria.lopez@techservice.local' },
  { title: 'Relevamiento del local', description: 'Inspeccionar el local para definir ubicación de cámaras', isCompleted: false, completedAt: undefined, trackingCode: 'TS-CAM003', assignedToEmail: 'diego.martinez@techservice.local' },
  { title: 'Instalación de cableado', description: 'Tirar cable UTP para las 6 cámaras', isCompleted: false, completedAt: undefined, trackingCode: 'TS-CAM003', assignedToEmail: 'pablo.sanchez@techservice.local' },
  { title: 'Montaje y configuración de cámaras', description: 'Instalar cámaras y configurar DVR', isCompleted: false, completedAt: undefined, trackingCode: 'TS-CAM003', assignedToEmail: 'diego.martinez@techservice.local' },
  { title: 'Diagnóstico de fuente de alimentación', description: 'Medir voltajes y verificar componentes', isCompleted: true, completedAt: '2026-05-15T15:30:00.000Z', trackingCode: 'TS-TV0004', assignedToEmail: 'carlos.garcia@techservice.local' },
  { title: 'Reemplazo de fuente', description: 'Instalar fuente de reemplazo compatible', isCompleted: true, completedAt: '2026-05-17T10:00:00.000Z', trackingCode: 'TS-TV0004', assignedToEmail: 'carlos.garcia@techservice.local' },
  { title: 'Testing de TV', description: 'Verificar imagen y sonido correctos', isCompleted: true, completedAt: '2026-05-18T10:30:00.000Z', trackingCode: 'TS-TV0004', assignedToEmail: 'carlos.garcia@techservice.local' },
  { title: 'Identificar circuito afectado', description: 'Trazar cableado y encontrar origen del cortocircuito', isCompleted: true, completedAt: '2026-06-04T10:00:00.000Z', trackingCode: 'TS-EL0005', assignedToEmail: 'pablo.sanchez@techservice.local' },
  { title: 'Reemplazar cableado defectuoso', description: 'Cambiar cables dañados en sector mostrador', isCompleted: false, completedAt: undefined, trackingCode: 'TS-EL0005', assignedToEmail: 'pablo.sanchez@techservice.local' },
  { title: 'Verificar instalación eléctrica', description: 'Medir continuidad y tensión en puntos reparados', isCompleted: false, completedAt: undefined, trackingCode: 'TS-EL0005', assignedToEmail: 'pablo.sanchez@techservice.local' },
  { title: 'Instalación de Access Point', description: 'Montar AP Ubiquiti en ubicación óptima', isCompleted: true, completedAt: '2026-05-20T12:00:00.000Z', trackingCode: 'TS-WF0006', assignedToEmail: 'diego.martinez@techservice.local' },
  { title: 'Configuración de red WiFi', description: 'Configurar SSID, VLAN y seguridad WPA3', isCompleted: true, completedAt: '2026-05-20T15:00:00.000Z', trackingCode: 'TS-WF0006', assignedToEmail: 'diego.martinez@techservice.local' },
  { title: 'Diagnóstico de fuente ATX', description: 'Verificar voltajes de salida', isCompleted: true, completedAt: '2026-06-03T11:00:00.000Z', trackingCode: 'TS-PC0008', assignedToEmail: 'laura.fernandez@techservice.local' },
  { title: 'Reemplazo de fuente ATX', description: 'Instalar fuente nueva de 650W (pendiente repuesto)', isCompleted: false, completedAt: undefined, trackingCode: 'TS-PC0008', assignedToEmail: 'laura.fernandez@techservice.local' },
  { title: 'Inspección de red actual', description: 'Evaluar infraestructura de red existente', isCompleted: true, completedAt: '2026-05-28T09:30:00.000Z', trackingCode: 'TS-WF0010', assignedToEmail: 'diego.martinez@techservice.local' },
  { title: 'Instalación de nodos mesh', description: 'Colocar 3 nodos WiFi 6 en ubicaciones estratégicas', isCompleted: true, completedAt: '2026-05-28T14:00:00.000Z', trackingCode: 'TS-WF0010', assignedToEmail: 'carlos.garcia@techservice.local' },
  { title: 'Configuración y optimización', description: 'Configurar roaming, band steering y QoS', isCompleted: true, completedAt: '2026-05-28T17:00:00.000Z', trackingCode: 'TS-WF0010', assignedToEmail: 'diego.martinez@techservice.local' },
  { title: 'Diagnóstico de panel LED', description: 'Identificar zonas oscuras del panel', isCompleted: true, completedAt: '2026-06-03T12:00:00.000Z', trackingCode: 'TS-TV0011', assignedToEmail: 'laura.fernandez@techservice.local' },
  { title: 'Reemplazo de panel LED', description: 'Instalar panel de reemplazo (en espera)', isCompleted: false, completedAt: undefined, trackingCode: 'TS-TV0011', assignedToEmail: 'laura.fernandez@techservice.local' },
  { title: 'Tendido de cables eléctricos', description: 'Tirar cables para 4 tomas nuevas', isCompleted: true, completedAt: '2026-05-22T11:00:00.000Z', trackingCode: 'TS-EL0012', assignedToEmail: 'pablo.sanchez@techservice.local' },
  { title: 'Instalación de tomas y protecciones', description: 'Colocar tomas, disyuntor y termica', isCompleted: true, completedAt: '2026-05-22T14:30:00.000Z', trackingCode: 'TS-EL0012', assignedToEmail: 'pablo.sanchez@techservice.local' },
  { title: 'Testing eléctrico', description: 'Medir continuidad y verificar protección', isCompleted: true, completedAt: '2026-05-22T15:30:00.000Z', trackingCode: 'TS-EL0012', assignedToEmail: 'pablo.sanchez@techservice.local' },
  { title: 'Tendido de cableado para cámaras', description: 'Cablear 8 puntos con UTP exterior', isCompleted: true, completedAt: '2026-05-12T13:00:00.000Z', trackingCode: 'TS-CAM013', assignedToEmail: 'pablo.sanchez@techservice.local' },
  { title: 'Montaje de cámaras Hikvision', description: 'Instalar 8 cámaras 4MP en fachada e interior', isCompleted: true, completedAt: '2026-05-13T16:00:00.000Z', trackingCode: 'TS-CAM013', assignedToEmail: 'diego.martinez@techservice.local' },
  { title: 'Configuración de DVR y app', description: 'Configurar DVR 8 canales y acceso remoto via app', isCompleted: true, completedAt: '2026-05-14T15:00:00.000Z', trackingCode: 'TS-CAM013', assignedToEmail: 'diego.martinez@techservice.local' },
];

export async function seedTasks(dataSource: DataSource) {
  const taskRepo = dataSource.getRepository(Task);
  const workOrderRepo = dataSource.getRepository(WorkOrder);
  const userRepo = dataSource.getRepository(User);

  for (const task of TASKS) {
    const workOrder = await workOrderRepo.findOne({
      where: { trackingCode: task.trackingCode },
    });

    if (!workOrder) {
      console.log('  Work order not found for task:', task.trackingCode);
      continue;
    }

    const existing = await taskRepo.findOne({
      where: { title: task.title, workOrderId: workOrder.id },
    });

    if (existing) {
      console.log('  Task already exists:', task.title, 'for', task.trackingCode);
      continue;
    }

    let assignedToId: string | undefined = undefined;
    if (task.assignedToEmail) {
      const tech = await userRepo.findOne({ where: { email: task.assignedToEmail } });
      if (tech) {
        assignedToId = tech.id;
      }
    }

    const taskEntity = taskRepo.create({
      title: task.title,
      description: task.description,
      isCompleted: task.isCompleted,
      completedAt: task.completedAt ? new Date(task.completedAt) : undefined,
      workOrderId: workOrder.id,
      assignedToId,
    });

    await taskRepo.save(taskEntity);
    console.log('  Task created:', task.title, '-', task.trackingCode);
  }
}
