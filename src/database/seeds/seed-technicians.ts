import { DataSource, In } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../../users/entities/user.entity';
import { Skill } from '../../skills/entities/skill.entity';
import { UserRole } from '../../users/enums/user-role.enum';

const TECHNICIANS = [
  {
    name: 'Carlos García',
    email: 'carlos.garcia@techservice.local',
    password: 'tech123',
    experience: '8 años en soporte técnico y reparación de equipos',
    trustRating: 4.8,
    skills: ['Redes y Conectividad', 'Reparación de PC', 'Instalación de Cámaras'],
    phone: '+5491122233344',
  },
  {
    name: 'María López',
    email: 'maria.lopez@techservice.local',
    password: 'tech123',
    experience: '5 años especializada en redes y conectividad',
    trustRating: 4.5,
    skills: ['Redes y Conectividad', 'Configuración de Routers', 'Soporte Remoto'],
    phone: '+5491155566677',
  },
  {
    name: 'Diego Martínez',
    email: 'diego.martinez@techservice.local',
    password: 'tech123',
    experience: '6 años en instalación de sistemas de seguridad',
    trustRating: 4.2,
    skills: ['Instalación de Cámaras', 'Instalación de Alarmas', 'Electricidad'],
    phone: '+5491177788899',
  },
  {
    name: 'Laura Fernández',
    email: 'laura.fernandez@techservice.local',
    password: 'tech123',
    experience: '4 años en soporte de software y mantenimiento',
    trustRating: 4.7,
    skills: ['Soporte de Software', 'Instalación de Software', 'Mantenimiento Preventivo'],
    phone: '+5491199900011',
  },
  {
    name: 'Pablo Sánchez',
    email: 'pablo.sanchez@techservice.local',
    password: 'tech123',
    experience: '7 años en reparación de PC y electrónica',
    trustRating: 4.0,
    skills: ['Reparación de PC', 'Electricidad', 'Mantenimiento Preventivo'],
    phone: '+5491122200033',
  },
];

export async function seedTechnicians(dataSource: DataSource) {
  const userRepo = dataSource.getRepository(User);
  const skillRepo = dataSource.getRepository(Skill);

  for (const tech of TECHNICIANS) {
    const existing = await userRepo.findOne({
      where: { email: tech.email },
    });

    if (existing) {
      console.log('  Technician already exists:', tech.email);
      continue;
    }

    const password = await bcrypt.hash(tech.password, 10);

    const skills = tech.skills.length
      ? await skillRepo.findBy({ name: In(tech.skills) })
      : [];

    const entity = userRepo.create({
      name: tech.name,
      email: tech.email,
      password,
      role: UserRole.TECHNICIAN,
      isActive: true,
      experience: tech.experience,
      trustRating: tech.trustRating,
      phone: tech.phone,
      skills,
    });

    await userRepo.save(entity);
    console.log('  Technician created:', tech.email);
  }
}
