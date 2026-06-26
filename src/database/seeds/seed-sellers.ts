import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../../users/entities/user.entity';
import { UserRole } from '../../users/enums/user-role.enum';

const SELLERS = [
  {
    name: 'Sofía Ramírez',
    email: 'sofia.ramirez@techservice.local',
    password: 'seller123',
    commission: 5.0,
    phone: '+5491122334455',
  },
  {
    name: 'Martín Torres',
    email: 'martin.torres@techservice.local',
    password: 'seller123',
    commission: 7.0,
    phone: '+5491166778899',
  },
];

export async function seedSellers(dataSource: DataSource) {
  const userRepo = dataSource.getRepository(User);

  for (const seller of SELLERS) {
    const existing = await userRepo.findOne({
      where: { email: seller.email },
    });

    if (existing) {
      console.log('  Seller already exists:', seller.email);
      continue;
    }

    const password = await bcrypt.hash(seller.password, 10);

    const entity = userRepo.create({
      name: seller.name,
      email: seller.email,
      password,
      role: UserRole.SELLER,
      isActive: true,
      commission: seller.commission,
      phone: seller.phone,
    });

    await userRepo.save(entity);
    console.log('  Seller created:', seller.email);
  }
}
