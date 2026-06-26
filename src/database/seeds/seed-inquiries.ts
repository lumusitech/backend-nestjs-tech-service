import { DataSource } from 'typeorm';
import { Inquiry } from '../../inquiries/entities/inquiry.entity';
import { InquirySource } from '../../inquiries/enums/inquiry-source.enum';
import { InquiryStatus } from '../../inquiries/enums/inquiry-status.enum';
import { InquiryRecommendation } from '../../inquiries/enums/inquiry-recommendation.enum';
import { InquiryDecision } from '../../inquiries/enums/inquiry-decision.enum';
import { User } from '../../users/entities/user.entity';

interface InquirySeed {
  clientName: string;
  clientPhone: string | null;
  clientEmail: string | null;
  clientAddress: string | null;
  description: string;
  source: InquirySource;
  status: InquiryStatus;
  priority: string | null;
  assignedToEmail: string | null;
  createdByEmail: string;
  technicianNotes: string | null;
  estimatedCost: number | null;
  estimatedDuration: number | null;
  materialsNeeded: string | null;
  recommendation: InquiryRecommendation | null;
  adminDecision: InquiryDecision;
  adminNotes: string | null;
  contactedAt: string | null;
  reviewedAt: string | null;
}

const INQUIRIES: InquirySeed[] = [
  {
    clientName: 'Roberto Díaz',
    clientPhone: '+54 11 4567-8901',
    clientEmail: 'roberto.diaz@gmail.com',
    clientAddress: 'Av. Santa Fe 2345, Piso 4, CABA',
    description:
      'Mi notebook HP no prende desde ayer. Hace un ruido raro cuando intento encenderla, como un click repetido. La uso para trabajar y la necesito urgente.',
    source: InquirySource.PHONE,
    status: InquiryStatus.CONTACTED,
    priority: 'high',
    assignedToEmail: 'carlos.garcia@techservice.local',
    createdByEmail: 'admin@techservice.local',
    technicianNotes:
      'Contacté al cliente. El ruido parece venir del disco HDD. Posible falla en el disco o en la fuente de alimentación. El cliente necesita la notebook para el lunes.',
    estimatedCost: 25000,
    estimatedDuration: 3,
    materialsNeeded: 'Disco SSD 480GB, pasta térmica',
    recommendation: InquiryRecommendation.REPAIR,
    adminDecision: InquiryDecision.PENDING,
    adminNotes: null,
    contactedAt: '2026-06-20T10:30:00.000Z',
    reviewedAt: null,
  },
  {
    clientName: 'Laura Fernández',
    clientPhone: '+54 11 5678-9012',
    clientEmail: 'laura.f@hotmail.com',
    clientAddress: 'Av. Cabildo 1890, Belgrano, CABA',
    description:
      'Quiero instalar 4 cámaras de seguridad en mi local comercial. Es una zapatería de unos 80m2. Necesito que graben 24hs y que pueda ver desde el celular.',
    source: InquirySource.WHATSAPP,
    status: InquiryStatus.REVIEWED,
    priority: 'medium',
    assignedToEmail: 'maria.lopez@techservice.local',
    createdByEmail: 'admin@techservice.local',
    technicianNotes:
      'Relevamiento realizado. El local tiene 80m2 approx. Se necesitan 4 cámaras bullet para exterior y 1 DVR de 8 canales. Cableado UTP Cat6 por techo.',
    estimatedCost: 180000,
    estimatedDuration: 8,
    materialsNeeded: '4x Cámaras Hikvision DS-2CD2047, 1x DVR 8 canales, 100m cable UTP Cat6, conectores RJ45, cañería',
    recommendation: InquiryRecommendation.REPAIR,
    adminDecision: InquiryDecision.APPROVED,
    adminNotes: 'Cliente aprobado. Presupuesto enviado por WhatsApp. Coordinar instalación para la próxima semana.',
    contactedAt: '2026-06-19T14:00:00.000Z',
    reviewedAt: '2026-06-20T09:15:00.000Z',
  },
  {
    clientName: 'Carlos Méndez',
    clientPhone: '+54 11 6789-0123',
    clientEmail: 'carlos.m@outlook.com',
    clientAddress: 'Av. Rivadavia 5678, Balvanera, CABA',
    description:
      'Mi televisor LG 55" enciende pero la pantalla queda negra. Se escucha el sonido pero no se ve nada. Tiene 3 años de uso.',
    source: InquirySource.EMAIL,
    status: InquiryStatus.NEW,
    priority: 'medium',
    assignedToEmail: null,
    createdByEmail: 'admin@techservice.local',
    technicianNotes: null,
    estimatedCost: null,
    estimatedDuration: null,
    materialsNeeded: null,
    recommendation: null,
    adminDecision: InquiryDecision.PENDING,
    adminNotes: null,
    contactedAt: null,
    reviewedAt: null,
  },
  {
    clientName: 'Ana García',
    clientPhone: '+54 11 7890-1234',
    clientEmail: 'ana.garcia@gmail.com',
    clientAddress: 'Av. Corrientes 3456, CABA',
    description:
      'Necesito que me arreglen la instalación eléctrica del departamento. Tengo breaker que se baja solo y algunas tomas que no funcionan.',
    source: InquirySource.REFERRAL,
    status: InquiryStatus.CONTACTED,
    priority: 'urgent',
    assignedToEmail: 'diego.martinez@techservice.local',
    createdByEmail: 'admin@techservice.local',
    technicianNotes:
      'Llamé a la cliente. Problema parece ser en el breaker general. Possible cortocircuito en el circuito de la cocina. La cliente dice que empezó después de instalar un microondas nuevo.',
    estimatedCost: 35000,
    estimatedDuration: 4,
    materialsNeeded: 'Breaker bipolar 20A, cable 2.5mm, cinta aisladora, termocontraíble',
    recommendation: InquiryRecommendation.REPAIR,
    adminDecision: InquiryDecision.PENDING,
    adminNotes: null,
    contactedAt: '2026-06-20T16:45:00.000Z',
    reviewedAt: null,
  },
  {
    clientName: 'Martín López',
    clientPhone: '+54 11 8901-2345',
    clientEmail: 'martin.lopez@yahoo.com',
    clientAddress: 'Av. Callao 1234, Retiro, CABA',
    description:
      'Quiero instalar WiFi en mi depósito. Es un galpón de 200m2. Necesito cobertura en toda la zona de oficinas y en el depósito.',
    source: InquirySource.WALK_IN,
    status: InquiryStatus.APPROVED,
    priority: 'high',
    assignedToEmail: 'pablo.sanchez@techservice.local',
    createdByEmail: 'admin@techservice.local',
    technicianNotes:
      'Visita técnica realizada. Galpón de 200m2 con zona de oficinas (50m2) y depósito (150m2). Se necesitan 2 Access Points Ubiquiti U6 y cableado UTP Cat6.',
    estimatedCost: 95000,
    estimatedDuration: 6,
    materialsNeeded: '2x Access Point Ubiquiti U6 Lite, 200m cable UTP Cat6, conectores RJ45, 2x caja de distribute',
    recommendation: InquiryRecommendation.REPAIR,
    adminDecision: InquiryDecision.APPROVED,
    adminNotes: 'Presupuesto aprobado. Coordinar instalación para el sábado.',
    contactedAt: '2026-06-18T11:00:00.000Z',
    reviewedAt: '2026-06-19T10:30:00.000Z',
  },
  {
    clientName: 'Sofía Ruiz',
    clientPhone: '+54 11 9012-3456',
    clientEmail: 'sofia.ruiz@gmail.com',
    clientAddress: 'Av. Belgrano 4567, San Telmo, CABA',
    description:
      'Mi PC de escritorio no enciende. La prendí ayer y funcionó bien. Hoy la quiero prender y no pasa nada. Ni luces ni ventiladores.',
    source: InquirySource.PHONE,
    status: InquiryStatus.NEW,
    priority: 'low',
    assignedToEmail: null,
    createdByEmail: 'admin@techservice.local',
    technicianNotes: null,
    estimatedCost: null,
    estimatedDuration: null,
    materialsNeeded: null,
    recommendation: null,
    adminDecision: InquiryDecision.PENDING,
    adminNotes: null,
    contactedAt: null,
    reviewedAt: null,
  },
  {
    clientName: 'Joaquín Herrera',
    clientPhone: '+54 11 1234-5678',
    clientEmail: 'joaquin.h@techsolutions.com.ar',
    clientAddress: 'Av. Scalabrini Ortiz 789, Palermo, CABA',
    description:
      'Somos una empresa de 15 empleados. Necesitamos soporte técnico mensual para nuestras notebooks y PCs. Queremos un plan de mantenimiento.',
    source: InquirySource.EMAIL,
    status: InquiryStatus.REVIEWED,
    priority: 'high',
    assignedToEmail: 'carlos.garcia@techservice.local',
    createdByEmail: 'admin@techservice.local',
    technicianNotes:
      'Reunión con el cliente. Empresa de 15 empleados, 12 notebooks y 3 PCs de escritorio. Necesitan mantenimiento preventivo trimestral y soporte correctivo on-demand.',
    estimatedCost: 45000,
    estimatedDuration: 0,
    materialsNeeded: null,
    recommendation: InquiryRecommendation.MAINTENANCE,
    adminDecision: InquiryDecision.PENDING,
    adminNotes: null,
    contactedAt: '2026-06-19T09:00:00.000Z',
    reviewedAt: '2026-06-20T14:00:00.000Z',
  },
  {
    clientName: 'Valentina Castro',
    clientPhone: '+54 11 2345-6789',
    clientEmail: 'valentina.c@gmail.com',
    clientAddress: 'Av. Dorrego 1567, Colegiales, CABA',
    description:
      'Mi impresora HP no imprime bien. Las páginas salen con rayas y manchas. Ya cambié el cartucho y sigue igual.',
    source: InquirySource.SOCIAL_MEDIA,
    status: InquiryStatus.NEW,
    priority: 'low',
    assignedToEmail: null,
    createdByEmail: 'admin@techservice.local',
    technicianNotes: null,
    estimatedCost: null,
    estimatedDuration: null,
    materialsNeeded: null,
    recommendation: null,
    adminDecision: InquiryDecision.PENDING,
    adminNotes: null,
    contactedAt: null,
    reviewedAt: null,
  },
  {
    clientName: 'Fernando Torres',
    clientPhone: '+54 11 3456-7890',
    clientEmail: 'fernando.t@empresa.com.ar',
    clientAddress: 'Av. del Libertador 890, Núñez, CABA',
    description:
      'Tengo un servidor Dell PowerEdge que se reinicia solo. Necesito que lo revisen urgente porque tengo datos críticos.',
    source: InquirySource.PHONE,
    status: InquiryStatus.CONTACTED,
    priority: 'urgent',
    assignedToEmail: 'diego.martinez@techservice.local',
    createdByEmail: 'admin@techservice.local',
    technicianNotes:
      'Llamé al cliente. El servidor se reinicia cada 2-3 horas. Posible problema de temperatura o fuente de alimentación. El cliente tiene backup reciente. Solicité acceso remoto para diagnóstico inicial.',
    estimatedCost: 60000,
    estimatedDuration: 5,
    materialsNeeded: 'Fuente de alimentación redundante, pasta térmica, aire comprimido',
    recommendation: InquiryRecommendation.REPAIR,
    adminDecision: InquiryDecision.PENDING,
    adminNotes: null,
    contactedAt: '2026-06-20T08:00:00.000Z',
    reviewedAt: null,
  },
  {
    clientName: 'Camila Romero',
    clientPhone: '+54 11 4567-0123',
    clientEmail: 'camila.r@outlook.com',
    clientAddress: 'Av. Scalabrini Ortiz 234, Villa Crespo, CABA',
    description:
      'Quiero que me instalen un air acondicionado split 3000 frig en el dormitorio. El local tiene la infraestructura preparada.',
    source: InquirySource.REFERRAL,
    status: InquiryStatus.REJECTED,
    priority: 'low',
    assignedToEmail: 'laura.fernandez@techservice.local',
    createdByEmail: 'admin@techservice.local',
    technicianNotes:
      'Contacté a la cliente. El trabajo es instalación de aire acondicionado, lo cual no es nuestro rubro principal. Se recomienda derivar a un especialista.',
    estimatedCost: null,
    estimatedDuration: null,
    materialsNeeded: null,
    recommendation: InquiryRecommendation.NO_ACTION,
    adminDecision: InquiryDecision.REJECTED,
    adminNotes: 'Servicio fuera de nuestro alcance. Derivamos a refrigeración profesional.',
    contactedAt: '2026-06-19T15:30:00.000Z',
    reviewedAt: '2026-06-20T09:00:00.000Z',
  },
  {
    clientName: 'Lucas Gutiérrez',
    clientPhone: '+54 11 5678-0123',
    clientEmail: 'lucas.g@gmail.com',
    clientAddress: 'Av. Corrientes 6789, Balvanera, CABA',
    description:
      'Mi notebook Lenovo no enciende. La usé ayer sin problemas y hoy no funciona. La necesito para trabajar.',
    source: InquirySource.WHATSAPP,
    status: InquiryStatus.CONVERTED,
    priority: 'high',
    assignedToEmail: 'carlos.garcia@techservice.local',
    createdByEmail: 'admin@techservice.local',
    technicianNotes:
      'Diagnóstico realizado: fuente de alimentación defectuosa. Se reemplazó fuente y notebook funciona correctamente.',
    estimatedCost: 35000,
    estimatedDuration: 3,
    materialsNeeded: 'Fuente de alimentación notebook Lenovo 65W',
    recommendation: InquiryRecommendation.REPAIR,
    adminDecision: InquiryDecision.APPROVED,
    adminNotes: 'Cliente aprobado. Trabajo realizado exitosamente.',
    contactedAt: '2026-06-18T09:30:00.000Z',
    reviewedAt: '2026-06-18T14:00:00.000Z',
  },
];

export async function seedInquiries(dataSource: DataSource): Promise<void> {
  const repo = dataSource.getRepository(Inquiry);
  const userRepo = dataSource.getRepository(User);

  const existing = await repo.count();
  if (existing > 0) {
    console.log(`  Inquiries already exist: ${existing}`);
    return;
  }

  const users = await userRepo.find({ select: { id: true, email: true } });
  const userMap = new Map(users.map((u) => [u.email, u.id]));

  const adminId = userMap.get('admin@techservice.local');
  if (!adminId) {
    console.warn('  Admin user not found, skipping inquiries seed');
    return;
  }

  for (const seed of INQUIRIES) {
    const assignedToId = seed.assignedToEmail
      ? userMap.get(seed.assignedToEmail) || null
      : null;

    const inquiry = new Inquiry();
    inquiry.clientName = seed.clientName;
    inquiry.clientPhone = seed.clientPhone ?? undefined!;
    inquiry.clientEmail = seed.clientEmail ?? undefined!;
    inquiry.clientAddress = seed.clientAddress ?? undefined!;
    inquiry.description = seed.description;
    inquiry.source = seed.source;
    inquiry.status = seed.status;
    inquiry.priority = seed.priority ?? undefined!;
    inquiry.assignedToId = assignedToId ?? undefined!;
    inquiry.createdById = adminId;
    inquiry.technicianNotes = seed.technicianNotes ?? undefined!;
    inquiry.estimatedCost = seed.estimatedCost ?? undefined!;
    inquiry.estimatedDuration = seed.estimatedDuration ?? undefined!;
    inquiry.materialsNeeded = seed.materialsNeeded ?? undefined!;
    inquiry.recommendation = seed.recommendation ?? undefined!;
    inquiry.adminDecision = seed.adminDecision;
    inquiry.adminNotes = seed.adminNotes ?? undefined!;
    inquiry.contactedAt = seed.contactedAt ? new Date(seed.contactedAt) : undefined!;
    inquiry.reviewedAt = seed.reviewedAt ? new Date(seed.reviewedAt) : undefined!;

    await repo.save(inquiry);
  }

  console.log(`  Inquiries seeded: ${INQUIRIES.length}`);
}
