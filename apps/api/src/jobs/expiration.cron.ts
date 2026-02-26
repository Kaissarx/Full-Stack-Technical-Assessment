import cron from 'node-cron';
import { prisma } from '../db/prisma';

// This cron expression '* * * * *' means "Run every 1 minute"
export const startExpirationCron = () => {
  console.log('⏱️  Expiration Cron Job initialized. Checking every minute...');

  cron.schedule('* * * * *', async () => {
    try {
      // 1. Find all reservations that are PENDING but their time is up
      const expiredReservations = await prisma.reservation.findMany({
        where: {
          status: 'PENDING',
          expiresAt: { lt: new Date() }, // "lt" means Less Than right now
        },
      });

      if (expiredReservations.length === 0) return; // Nothing to clean up

      console.log(`🧹 Found ${expiredReservations.length} expired reservations. Cleaning up...`);

      // 2. Loop through each expired reservation and fix the database
      for (const reservation of expiredReservations) {
        await prisma.$transaction(async (tx) => {
          
          // Mark reservation as EXPIRED
          await tx.reservation.update({
            where: { id: reservation.id },
            data: { status: 'EXPIRED' },
          });

          // Give the stock back to the product
          await tx.product.update({
            where: { id: reservation.productId },
            data: { stock: { increment: reservation.quantity } },
          });

          // Create an audit log saying we released the stock
          await tx.inventoryLog.create({
            data: {
              productId: reservation.productId,
              type: 'RELEASED',
              quantity: reservation.quantity,
            },
          });
        });
      }

      console.log('✅ Cleanup complete. Stock restored.');
    } catch (error) {
      console.error('❌ Error in expiration cron job:', error);
    }
  });
};