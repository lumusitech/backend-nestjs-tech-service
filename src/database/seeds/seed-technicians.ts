import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../../users/entities/user.entity';
import { UserRole } from '../../users/enums/user-role.enum';

const TECHNICIANS = [
  {
    name: 'Carlos García',
    email: 'carlos.garcia@techservice.local',
    password: 'tech123',
  },
  {
    name: 'María López',
    email: 'maria.lopez@techservice.local',
    password: 'tech123',
  },
  {
    name: 'Diego Martínez',
    email: 'diego.martinez@techservice.local',
    password: 'tech123',
  },
  {
    name: 'Laura Fernández',
    email: 'laura.fernandez@techservice.local',
    password: 'tech123',
  },
  {
    name: 'Pablo Sánchez',
    email: 'pablo.sanchez@techservice.local',
    password: 'tech123',
  },
];

export async function seedTechnicians(dataSource: DataSource) {
  const userRepo = dataSource.getRepository(User);

  for (const tech of TECHNICIANS) {
    const existing = await userRepo.findOne({
      where: { email: tech.email },
    });

    if (existing) {
      console.log('  Technician already exists:', tech.email);
      continue;
    }

    const password = await bcrypt.hash(tech.password, 10);

    const entity = userRepo.create({
      name: tech.name,
      email: tech.email,
      password,
      role: UserRole.TECHNICIAN,
      isActive: true,
    });

    await userRepo.save(entity);
    console.log('  Technician created:', tech.email);
  }
}
