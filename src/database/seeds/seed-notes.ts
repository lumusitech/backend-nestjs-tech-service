import { DataSource } from 'typeorm';
import { WorkOrderNote } from '../../work-orders/entities/work-order-note.entity';
import { NoteType } from '../../work-orders/enums/note-type.enum';
import { WorkOrder } from '../../work-orders/entities/work-order.entity';

interface NoteSeed {
  type: NoteType;
  content: string;
  trackingCode: string;
}

const NOTES: NoteSeed[] = [
  { type: NoteType.DIAGNOSIS, content: 'PC no enciende. Fuente de alimentación quemada. Disco duro hace ruidos de clic.', trackingCode: 'TS-PC0001' },
  { type: NoteType.OBSERVATION, content: 'Cliente trajo equipo con polvo excesivo. Se realizó limpieza interna completa.', trackingCode: 'TS-PC0001' },
  { type: NoteType.INTERNAL, content: 'Se ofreció upgrade de RAM de 8GB a 16GB. Cliente aceptó por $15000 adicionales.', trackingCode: 'TS-PC0001' },
  { type: NoteType.DIAGNOSIS, content: 'Notebook presenta líneas verticales en pantalla. Prueba con monitor externo funciona OK.', trackingCode: 'TS-NB0002' },
  { type: NoteType.ISSUE, content: 'Repuesto de pantalla no disponible en stock local. Tiempo estimado de llegada: 5-7 días hábiles.', trackingCode: 'TS-NB0002' },
  { type: NoteType.OBSERVATION, content: 'Relevamiento completado. Se requieren 6 cámaras: 4 exterior, 2 interior. DVR de 8 canales.', trackingCode: 'TS-CAM003' },
  { type: NoteType.DIAGNOSIS, content: 'TV enciende pero no hay imagen. Backlight OK. Fuente no entrega voltaje correcto en secundario.', trackingCode: 'TS-TV0004' },
  { type: NoteType.OBSERVATION, content: 'Equipo de 3 años. Cliente menciona que se apagó después de una tormenta eléctrica.', trackingCode: 'TS-TV0004' },
  { type: NoteType.DIAGNOSIS, content: 'Cortocircuito detectado en línea del sector mostrador. Cableado viejo con aislamiento deteriorado.', trackingCode: 'TS-EL0005' },
  { type: NoteType.ISSUE, content: 'Se requiere corte de energía parcial para realizar la reparación. Coordinar con cliente horario.', trackingCode: 'TS-EL0005' },
  { type: NoteType.DIAGNOSIS, content: 'WiFi del local tiene zonas muertas. Router actual no cubre los 200m2. Se recomienda red mesh.', trackingCode: 'TS-WF0010' },
  { type: NoteType.OBSERVATION, content: 'Cliente tiene 15 dispositivos conectados simultáneamente. Se configuró QoS para priorizar VoIP.', trackingCode: 'TS-WF0010' },
  { type: NoteType.DIAGNOSIS, content: 'TV presenta zonas oscuras en panel LED. Panel de reemplazo compatible: modelo Samsung LSY430HQ.', trackingCode: 'TS-TV0011' },
  { type: NoteType.OBSERVATION, content: 'Presupuesto aprobado por el cliente. Se ordenó panel de reemplazo.', trackingCode: 'TS-TV0011' },
  { type: NoteType.DIAGNOSIS, content: 'Oficina necesita 4 tomas nuevas. Tablero actual con espacio disponible para nuevos circuitos.', trackingCode: 'TS-EL0012' },
  { type: NoteType.OBSERVATION, content: 'Trabajo completado sin inconvenientes. Cliente satisfecho con la instalación.', trackingCode: 'TS-EL0012' },
  { type: NoteType.OBSERVATION, content: 'Cliente solicita 8 cámaras con visión nocturna. Se recomienda modelo Hikvision ColorVu.', trackingCode: 'TS-CAM013' },
  { type: NoteType.INTERNAL, content: 'Se incluyó cableado exterior resistente a UV. Garantía de 1 año en instalación.', trackingCode: 'TS-CAM013' },
  { type: NoteType.OBSERVATION, content: 'Cliente solicitó mantenimiento preventivo de su PC. Equipo de 5 años, funciona lento.', trackingCode: 'TS-PC0014' },
  { type: NoteType.OBSERVATION, content: 'Mantenimiento de rutina: 3 PCs, 2 impresoras, 1 servidor NAS. Oficina pequeña.', trackingCode: 'TS-MT0015' },
];

export async function seedNotes(dataSource: DataSource) {
  const noteRepo = dataSource.getRepository(WorkOrderNote);
  const workOrderRepo = dataSource.getRepository(WorkOrder);

  for (const note of NOTES) {
    const workOrder = await workOrderRepo.findOne({
      where: { trackingCode: note.trackingCode },
    });

    if (!workOrder) {
      console.log('  Work order not found for note:', note.trackingCode);
      continue;
    }

    const existing = await noteRepo.findOne({
      where: {
        content: note.content,
        workOrderId: workOrder.id,
      },
    });

    if (existing) {
      console.log('  Note already exists for:', note.trackingCode);
      continue;
    }

    const noteEntity = noteRepo.create({
      type: note.type,
      content: note.content,
      workOrderId: workOrder.id,
    });

    await noteRepo.save(noteEntity);
    console.log('  Note created:', note.type, '-', note.trackingCode);
  }
}
