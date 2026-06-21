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

async function runSeeds() {
  await dataSource.initialize();

  console.log('Running seeds...');

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

  console.log('Seeds finished');

  await dataSource.destroy();
}

runSeeds().catch((err) => {
  console.error('Seed error:', err);
  process.exit(1);
});
