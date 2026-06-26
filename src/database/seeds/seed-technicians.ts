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
    experience: '8 years in technical support and equipment repair',
    trustRating: 4.8,
    skills: ['Network Setup', 'PC Repair', 'Camera Installation'],
    phone: '+5491122233344',
  },
  {
    name: 'María López',
    email: 'maria.lopez@techservice.local',
    password: 'tech123',
    experience: '5 years specialized in networks and connectivity',
    trustRating: 4.5,
    skills: ['Network Setup', 'Router Configuration', 'Remote Support'],
    phone: '+5491155566677',
  },
  {
    name: 'Diego Martínez',
    email: 'diego.martinez@techservice.local',
    password: 'tech123',
    experience: '6 years in security system installation',
    trustRating: 4.2,
    skills: ['Camera Installation', 'Alarm Installation', 'Electrical Work'],
    phone: '+5491177788899',
  },
  {
    name: 'Laura Fernández',
    email: 'laura.fernandez@techservice.local',
    password: 'tech123',
    experience: '4 years in software support and maintenance',
    trustRating: 4.7,
    skills: ['Software Support', 'Software Installation', 'Preventive Maintenance'],
    phone: '+5491199900011',
  },
  {
    name: 'Pablo Sánchez',
    email: 'pablo.sanchez@techservice.local',
    password: 'tech123',
    experience: '7 years in PC repair and electronics',
    trustRating: 4.0,
    skills: ['PC Repair', 'Electrical Work', 'Preventive Maintenance'],
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
