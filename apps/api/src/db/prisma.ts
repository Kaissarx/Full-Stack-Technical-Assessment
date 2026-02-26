import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import 'dotenv/config';

// 1. Create a connection pool to your Neon database
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// 2. Wrap that pool in the Prisma adapter
const adapter = new PrismaPg(pool);

// 3. Pass the adapter to the Prisma Client
export const prisma = new PrismaClient({ adapter });