import 'dotenv/config';
import dataSource from './data-source';
import { seedAdmin } from './seeds/seed-admin';

async function runSeeds() {
  await dataSource.initialize();

  console.log('Running seeds...');

  await seedAdmin(dataSource);

  console.log('Seeds finished');

  await dataSource.destroy();
}

runSeeds().catch((err) => {
  console.error('Seed error:', err);
  process.exit(1);
});
