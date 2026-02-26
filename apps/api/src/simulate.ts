import { config } from 'dotenv';
config(); 

import { prisma } from './db/prisma';

const API_URL = 'http://localhost:3000/api';

// ⚠️ PASTE YOUR REAL PRODUCT ID HERE:
const PRODUCT_ID = '914af6b2-0fc1-4f57-91e7-3331e8f78d24';

async function runSimulation() {
  console.log('🚀 Setting up 100 test users in the database...');

  // 1. Clean up any old test users, then create 100 new real ones in Postgres
  await prisma.user.deleteMany({ where: { id: { startsWith: 'sim-user' } } });
  
  // 🔥 FIX: Removed the 'name' property so Prisma accepts it!
  await prisma.user.createMany({
    data: Array.from({ length: 100 }, (_, i) => ({
      id: `sim-user-${i}`,
      email: `sim${i}@test.com`
    }))
  });

  console.log('🔑 Getting VIP wristbands (Tokens) for all 100 users...');
  const tokens: string[] = [];
  for (let i = 0; i < 100; i++) {
    const res = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: `sim-user-${i}` })
    });
    const data = await res.json();
    tokens.push(data.token);
  }

  console.log('💥 FIRE! Sending 100 reservation requests at the exact same millisecond...');
  const requests = tokens.map((token, index) =>
    fetch(`${API_URL}/reserve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ productId: PRODUCT_ID, quantity: 1, userId: `sim-user-${index}` })
    }).then(res => res.json())
  );

  const results = await Promise.all(requests);

  const successes = results.filter(r => r.success === true);
  const failures = results.filter(r => r.success === false);
  const outOfStockFailures = failures.filter(r => r.message && r.message.includes('stock'));

  console.log('\n📊 --- SIMULATION RESULTS ---');
  console.log(`🟢 Successful Reservations: ${successes.length}`);
  console.log(`🔴 Failed Reservations: ${failures.length}`);
  console.log(`📦 Out of Stock Errors: ${outOfStockFailures.length}`);

  if (successes.length > 0) {
    console.log('\n🏆 CONCURRENCY TEST PASSED!');
    console.log(`The database successfully processed ${successes.length} orders and rejected the rest safely!`);
  } else {
    console.log('\n⚠️ Something blocked the requests. First error message:', failures[0]?.message);
  }
}

runSimulation().catch(console.error);