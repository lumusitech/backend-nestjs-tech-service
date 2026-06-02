import { INestApplication } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { DataSource } from 'typeorm';
import { User } from '../../src/users/entities/user.entity';
import { UserRole } from '../../src/users/enums/user-role.enum';
import { Client } from '../../src/clients/entities/client.entity';
import { Supplier } from '../../src/suppliers/entities/supplier.entity';
import { ServiceType } from '../../src/service-types/entities/service-type.entity';

export interface SeedData {
  admin: User;
  technician: User;
  client: Client;
  supplier: Supplier;
  serviceType: ServiceType;
}

export async function seedTestData(app: INestApplication): Promise<SeedData> {
  const dataSource = app.get(DataSource);

  // Run migrations
  await dataSource.runMigrations();

  // Seed admin user
  const adminRepo = dataSource.getRepository(User);
  const hashedPassword = await bcrypt.hash('test123', 10);

  const admin = await adminRepo.save(
    adminRepo.create({
      name: 'Test Admin',
      email: 'admin@test.local',
      password: hashedPassword,
      role: UserRole.ADMIN,
    }),
  );

  // Seed technician
  const technician = await adminRepo.save(
    adminRepo.create({
      name: 'Test Technician',
      email: 'tech@test.local',
      password: hashedPassword,
      role: UserRole.TECHNICIAN,
    }),
  );

  // Seed client
  const clientRepo = dataSource.getRepository(Client);
  const client = await clientRepo.save(
    clientRepo.create({
      name: 'Test Client',
      email: 'client@test.com',
      phone: '+54 11 1111-1111',
      address: 'Client Address 123',
    }),
  );

  // Seed supplier
  const supplierRepo = dataSource.getRepository(Supplier);
  const supplier = await supplierRepo.save(
    supplierRepo.create({
      name: 'Test Supplier',
      email: 'supplier@test.com',
      phone: '+54 11 2222-2222',
      address: 'Supplier Address 456',
    }),
  );

  // Seed service type
  const serviceTypeRepo = dataSource.getRepository(ServiceType);
  const serviceType = await serviceTypeRepo.save(
    serviceTypeRepo.create({
      name: 'Reparación de PC',
      description: 'Servicio de reparación de computadoras',
      estimatedDuration: 120,
    }),
  );

  return { admin, technician, client, supplier, serviceType };
}

export async function cleanupDatabase(app: INestApplication): Promise<void> {
  const dataSource = app.get(DataSource);
  const entities = dataSource.entityMetadatas;

  for (const entity of entities) {
    const repo = dataSource.getRepository(entity.name);
    await repo.query(`TRUNCATE TABLE "${entity.tableName}" CASCADE`);
  }
}
