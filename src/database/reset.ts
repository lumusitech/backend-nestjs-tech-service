import 'dotenv/config';
import dataSource from './data-source';
import { seedAdmin } from './seeds/seed-admin';
import { seedServiceTypes } from './seeds/seed-service-types';
import { seedTechnicians } from './seeds/seed-technicians';
import { seedClients } from './seeds/seed-clients';
import { seedSuppliers } from './seeds/seed-suppliers';
import { seedWorkOrders } from './seeds/seed-work-orders';
import { seedTasks } from './seeds/seed-tasks';
import { seedMaterials } from './seeds/seed-materials';
import { seedNotes } from './seeds/seed-notes';
import { seedPayments } from './seeds/seed-payments';
import { seedInvoices } from './seeds/seed-invoices';
import { seedExpenses } from './seeds/seed-expenses';
import { seedPendingItems } from './seeds/seed-pending-items';
import { seedInquiries } from './seeds/seed-inquiries';
import { seedNotifications } from './seeds/seed-notifications';

const TABLES = [
  'notifications',
  'invoices',
  'payments',
  'work_order_notes',
  'work_order_materials',
  'tasks',
  'work_order_technicians',
  'work_orders',
  'inquiries',
  'pending_items',
  'expenses',
  'user_preferences',
  'service_types',
  'clients',
  'suppliers',
  'users',
];

async function reset() {
  await dataSource.initialize();

  console.log('🗑️  Truncating all tables...');

  for (const table of TABLES) {
    await dataSource.query(`TRUNCATE TABLE "${table}" CASCADE`);
    console.log(`  ✓ ${table}`);
  }

  console.log('');
  console.log('🌱 Re-seeding...');

  await seedAdmin(dataSource);
  await seedServiceTypes(dataSource);
  await seedTechnicians(dataSource);
  await seedClients(dataSource);
  await seedSuppliers(dataSource);
  await seedWorkOrders(dataSource);
  await seedTasks(dataSource);
  await seedMaterials(dataSource);
  await seedNotes(dataSource);
  await seedPayments(dataSource);
  await seedInvoices(dataSource);
  await seedExpenses(dataSource);
  await seedPendingItems(dataSource);
  await seedInquiries(dataSource);
  await seedNotifications(dataSource);

  console.log('');
  console.log('✅ Reset complete! All data restored to seed state.');
  await dataSource.destroy();
}

reset().catch((err) => {
  console.error('Reset error:', err);
  process.exit(1);
});
