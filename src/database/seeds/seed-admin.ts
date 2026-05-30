import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../../users/entities/user.entity';
import { UserRole } from '../../users/enums/user-role.enum';

export async function seedAdmin(dataSource: DataSource) {
  const userRepo = dataSource.getRepository(User);

  const email = process.env.ADMIN_EMAIL || 'admin@techservice.local';
  const rawPassword = process.env.ADMIN_PASSWORD || 'admin123';

  const existingAdmin = await userRepo.findOne({
    where: { email },
  });

  if (existingAdmin) {
    console.log('  Admin already exists:', email);
    return;
  }

  const password = await bcrypt.hash(rawPassword, 10);

  await userRepo.save({
    name: 'Admin',
    email,
    password,
    role: UserRole.ADMIN,
    isActive: true,
  });

  console.log('  Admin user created:', email);
}
