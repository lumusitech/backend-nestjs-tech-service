import { DataSource } from 'typeorm';
import { ServiceType } from '../../service-types/entities/service-type.entity';

const SERVICE_TYPES: { name: string; description: string; estimatedDuration: number; requiresDelivery: boolean }[] = [
  {
    name: 'Reparación de PC',
    description: 'Diagnóstico y reparación de computadoras de escritorio',
    estimatedDuration: 120,
    requiresDelivery: true,
  },
  {
    name: 'Reparación de Notebook',
    description: 'Diagnóstico y reparación de notebooks y laptops',
    estimatedDuration: 150,
    requiresDelivery: true,
  },
  {
    name: 'Reparación de TV',
    description: 'Diagnóstico y reparación de televisores',
    estimatedDuration: 180,
    requiresDelivery: true,
  },
  {
    name: 'Instalación de cámaras de seguridad',
    description:
      'Instalación y configuración de sistemas de cámaras de seguridad',
    estimatedDuration: 240,
    requiresDelivery: false,
  },
  {
    name: 'Servicio eléctrico',
    description: 'Instalación y reparación de instalaciones eléctricas',
    estimatedDuration: 180,
    requiresDelivery: false,
  },
  {
    name: 'Instalación de red/WiFi',
    description: 'Instalación y configuración de redes e internet WiFi',
    estimatedDuration: 120,
    requiresDelivery: false,
  },
  {
    name: 'Mantenimiento general',
    description: 'Mantenimiento preventivo y limpieza de equipos',
    estimatedDuration: 60,
    requiresDelivery: false,
  },
];

export async function seedServiceTypes(dataSource: DataSource) {
  const serviceTypeRepo = dataSource.getRepository(ServiceType);

  for (const st of SERVICE_TYPES) {
    const existing = await serviceTypeRepo.findOne({
      where: { name: st.name },
    });

    if (existing) {
      console.log('  Service type already exists:', st.name);
      continue;
    }

    await serviceTypeRepo.save({
      name: st.name,
      description: st.description,
      estimatedDuration: st.estimatedDuration,
      isActive: true,
      requiresDelivery: st.requiresDelivery,
    });

    console.log('  Service type created:', st.name);
  }
}
