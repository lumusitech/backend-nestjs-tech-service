import { DataSource } from 'typeorm';
import { Skill } from '../../skills/entities/skill.entity';

const SKILLS = [
  { name: 'Redes y Conectividad', description: 'Configuración de redes LAN/WAN, routers, switches y cableado estructurado', category: 'Redes' },
  { name: 'Instalación de Cámaras', description: 'Instalación y configuración de cámaras IP, analógicas y NVR/DVR', category: 'Electrónica' },
  { name: 'Reparación de PC', description: 'Diagnóstico y reparación de hardware de computadoras de escritorio y notebooks', category: 'Hardware' },
  { name: 'Soporte de Software', description: 'Instalación, configuración y resolución de problemas de software', category: 'Software' },
  { name: 'Electricidad', description: 'Trabajos eléctricos básicos: instalación de tomas, llaves y tableros', category: 'Electrónica' },
  { name: 'Configuración de Routers', description: 'Configuración de routers WiFi, mesh, VLANs y control parental', category: 'Redes' },
  { name: 'Instalación de Alarmas', description: 'Instalación y configuración de sistemas de alarma y sensores', category: 'Electrónica' },
  { name: 'Mantenimiento Preventivo', description: 'Limpieza, revisión y mantenimiento periódico de equipos', category: 'Hardware' },
  { name: 'Instalación de Software', description: 'Instalación de sistemas operativos, office y programas específicos', category: 'Software' },
  { name: 'Soporte Remoto', description: 'Asistencia técnica a distancia mediante herramientas de escritorio remoto', category: 'Software' },
];

export async function seedSkills(dataSource: DataSource) {
  const skillRepo = dataSource.getRepository(Skill);

  for (const skill of SKILLS) {
    const existing = await skillRepo.findOne({
      where: { name: skill.name },
    });

    if (existing) {
      console.log('  Skill already exists:', skill.name);
      continue;
    }

    const entity = skillRepo.create({
      name: skill.name,
      description: skill.description,
      category: skill.category,
      isActive: true,
    });

    await skillRepo.save(entity);
    console.log('  Skill created:', skill.name);
  }
}
