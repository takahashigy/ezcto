import { getDb } from './server/db';
import { projects } from './drizzle/schema';
import { desc } from 'drizzle-orm';

async function checkLatest() {
  const db = await getDb();
  if (!db) return;
  
  const latest = await db.select().from(projects).orderBy(desc(projects.createdAt)).limit(1);
  if (latest.length === 0) {
    console.log('No projects found');
    return;
  }
  
  const project = latest[0];
  console.log('Latest Project:');
  console.log('  ID:', project.id);
  console.log('  Name:', project.name);
  console.log('  Status:', project.status);
  console.log('  Created:', project.createdAt);
}

checkLatest();
