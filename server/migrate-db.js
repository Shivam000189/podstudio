const { Client } = require('pg');
require('dotenv').config();

async function run() {
  let connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('No DATABASE_URL in .env');
    process.exit(1);
  }

  // Neon connection needs ssl
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('Connecting to database...');
    await client.connect();
    console.log('Connected! Executing schema update...');

    await client.query(`
      ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "clerk_id" TEXT;
      ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "email_verfied_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP;
      ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "update_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP;
      ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "deleted_at" TIMESTAMP(3);
      ALTER TABLE "User" ALTER COLUMN "password" DROP NOT NULL;
      ALTER TABLE "User" ALTER COLUMN "avatar_url" DROP NOT NULL;
      CREATE UNIQUE INDEX IF NOT EXISTS "User_clerk_id_key" ON "User"("clerk_id");
    `);

    console.log('✅ Database schema successfully updated with clerk_id!');
  } catch (err) {
    console.error('Error migrating database:', err);
  } finally {
    await client.end();
  }
}

run();
